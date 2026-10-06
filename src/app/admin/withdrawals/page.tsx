import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SECOND_APPROVAL_FROM, sumMoney } from "@/lib/balance";
import type { WithdrawalStatus } from "@/lib/database.types";
import { DecisionForm } from "./DecisionForm";
import { RevealDetails } from "./RevealDetails";
import { freezeWithdrawalsAction } from "./actions";

export const metadata: Metadata = { title: "Withdrawals · Admin" };

const TONE = {
  pending_confirmation: "pending",
  requested: "pending",
  paid: "success",
  rejected: "error",
  cancelled: "closed",
  expired: "closed",
} as const;
const LABEL: Record<WithdrawalStatus, string> = {
  pending_confirmation: "Waiting for creator's email confirmation",
  requested: "Confirmed",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled by creator",
  expired: "Expired",
};

export default async function AdminWithdrawalsPage() {
  await requireAdminMfa("/admin/withdrawals");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user?.email ?? "";

  const [{ data }, { data: freezes }, { data: audit }, { data: entries }, { data: released }] = await Promise.all([
    supabase
      .from("withdrawals")
      .select(
        "id, applicant_id, amount, status, payout_details, details_last4, account_holder_match, hold_hours, payable_after, approved_by, decided_by, paid_ref, admin_note, created_at, decided_at, applicants(name, email, handle)",
      )
      .order("created_at", { ascending: true }),
    supabase.from("withdrawal_freezes").select("applicant_id, reason, frozen_by"),
    supabase.from("admin_audit").select("id, admin_email, action, detail, created_at").order("created_at", { ascending: false }).limit(15),
    supabase.from("balance_entries").select("amount, kind"),
    supabase.from("assignments").select("applicant_payout_amount").eq("status", "paid"),
  ]);

  const all = data ?? [];
  const open = all.filter((w) => w.status === "requested" || w.status === "pending_confirmation");
  const done = all.filter((w) => w.status !== "requested" && w.status !== "pending_confirmation").reverse();
  const toPay = open.filter((w) => w.status === "requested");
  const owed = sumMoney(toPay.map((w) => Number(w.amount)));
  const frozenIds = new Set((freezes ?? []).map((f) => f.applicant_id));

  // Reconciliation: the money we say we owe creators must add up.
  const ledger = entries ?? [];
  const releasedTotal = sumMoney((released ?? []).map((a) => Number(a.applicant_payout_amount)));
  const earned = sumMoney(ledger.filter((e) => e.kind === "earning").map((e) => Number(e.amount)));
  const balances = sumMoney(ledger.map((e) => Number(e.amount)));
  const counted = sumMoney(
    all.filter((w) => ["pending_confirmation", "requested", "paid"].includes(w.status)).map((w) => Number(w.amount)),
  );
  const creditsMatch = Math.abs(releasedTotal - earned) < 0.005;
  const balanceMatch = Math.abs(balances - (earned - counted)) < 0.005;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Withdrawals</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {toPay.length} confirmed ·{" "}
          <span className="font-semibold text-foreground">{formatCurrency(owed)}</span> to pay. Send each one by bank
          transfer through Wise once its hold has passed: Send money, choose to send by email, and Wise asks the creator for their bank details. Then mark it paid here. Requests of{" "}
          {formatCurrency(SECOND_APPROVAL_FROM)} or more need one admin to approve and a different admin to mark them paid.
        </p>
      </header>

      <Card className={creditsMatch && balanceMatch ? "mb-8 border-border/70" : "mb-8 border-destructive"}>
        <CardContent>
          <p className="font-heading text-lg font-semibold text-foreground">
            {creditsMatch && balanceMatch ? "Books check: everything adds up" : "Books check: numbers don't match"}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
            <div><dt>Payouts released</dt><dd className="font-semibold text-foreground">{formatCurrency(releasedTotal)}</dd></div>
            <div><dt>Credited to balances</dt><dd className="font-semibold text-foreground">{formatCurrency(earned)}</dd></div>
            <div><dt>Withdrawals counted</dt><dd className="font-semibold text-foreground">{formatCurrency(counted)}</dd></div>
            <div><dt>Owed to creators now</dt><dd className="font-semibold text-foreground">{formatCurrency(balances)}</dd></div>
          </dl>
          {!creditsMatch && (
            <p className="mt-2 text-sm text-destructive">
              Released payouts and credits differ by {formatCurrency(Math.abs(releasedTotal - earned))}. A payout may have been
              released before balances existed, or credited twice. Check Payouts.
            </p>
          )}
          {!balanceMatch && (
            <p className="mt-2 text-sm text-destructive">
              Balances don&apos;t equal credits minus withdrawals. Don&apos;t pay anything until this is explained.
            </p>
          )}
        </CardContent>
      </Card>

      {all.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <p className="text-[15px] text-muted-foreground">No withdrawal requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {open.length > 0 && <Section title="Open requests" items={open} me={me} frozenIds={frozenIds} actionable />}
          {done.length > 0 && <Section title="Handled" items={done} me={me} frozenIds={frozenIds} />}
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-3 font-heading text-xl font-semibold text-foreground">Recent admin activity</h2>
        {(audit ?? []).length === 0 ? (
          <p className="text-[15px] text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border/70 bg-card text-sm">
            {(audit ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="text-foreground">
                  <span className="font-semibold">{a.admin_email}</span> · {a.action.replaceAll("_", " ")}
                  {a.detail ? ` (${a.detail})` : ""}
                </span>
                <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type Row = {
  id: string;
  applicant_id: string;
  amount: number;
  status: WithdrawalStatus;
  payout_details: string;
  details_last4: string | null;
  account_holder_match: boolean;
  hold_hours: number;
  payable_after: string | null;
  approved_by: string | null;
  decided_by: string | null;
  paid_ref: string | null;
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
  applicants: { name: string; email: string; handle: string } | null;
};

function Section({
  title,
  items,
  me,
  frozenIds,
  actionable,
}: {
  title: string;
  items: Row[];
  me: string;
  frozenIds: Set<string>;
  actionable?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-4">
        {items.map((w) => {
          const isOpen = w.status === "requested" || w.status === "pending_confirmation";
          const large = Number(w.amount) >= SECOND_APPROVAL_FROM;
          const frozen = frozenIds.has(w.applicant_id);
          return (
            <li key={w.id}>
              <Card className="border-border/70">
                <CardContent>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={TONE[w.status]}>{LABEL[w.status]}</StatusBadge>
                        {frozen && <StatusBadge tone="error">Withdrawals frozen</StatusBadge>}
                      </div>
                      <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                        {w.applicants?.name} (@{w.applicants?.handle})
                      </h3>
                      <p className="text-[15px] text-muted-foreground">{w.applicants?.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Requested {formatDate(w.created_at)}
                        {w.decided_at ? ` · decided ${formatDate(w.decided_at)}` : ""}
                        {w.decided_by ? ` by ${w.decided_by}` : ""}
                      </p>
                    </div>
                    <p className="font-heading text-2xl font-semibold text-primary">{formatCurrency(w.amount)}</p>
                  </div>

                  {isOpen && (
                    <ul className="mt-3 flex flex-col gap-1 text-sm">
                      {!w.account_holder_match && (
                        <li className="font-semibold text-destructive">
                          The name on the account doesn&apos;t match this creator&apos;s profile name. Check it before paying.
                        </li>
                      )}
                      {w.hold_hours >= 72 && (
                        <li className="text-muted-foreground">First withdrawal or new payment details: {w.hold_hours}-hour hold.</li>
                      )}
                      {large && (
                        <li className="text-muted-foreground">
                          Needs two admins. {w.approved_by ? `Approved by ${w.approved_by}.` : "Not approved yet."}
                        </li>
                      )}
                    </ul>
                  )}

                  {isOpen ? (
                    <div className="mt-4">
                      <RevealDetails id={w.id} last4={w.details_last4} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Payment details were removed{w.details_last4 ? ` (email started ${w.details_last4})` : ""}.
                    </p>
                  )}

                  {w.paid_ref && <p className="mt-3 text-sm text-muted-foreground">Reference: {w.paid_ref}</p>}
                  {w.admin_note && <p className="mt-3 text-sm text-muted-foreground">Note: {w.admin_note}</p>}

                  {actionable && isOpen && (
                    <div className="mt-4 border-t border-border pt-4">
                      <DecisionForm
                        id={w.id}
                        status={w.status === "requested" ? "requested" : "pending_confirmation"}
                        needsSecond={large}
                        approvedBy={w.approved_by}
                        me={me}
                        holdUntil={w.payable_after}
                        frozen={frozen}
                      />
                    </div>
                  )}

                  {isOpen && (
                    <form action={freezeWithdrawalsAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm">
                      <input type="hidden" name="applicant_id" value={w.applicant_id} />
                      <input type="hidden" name="frozen" value={frozen ? "false" : "true"} />
                      {!frozen && (
                        <input
                          name="reason"
                          maxLength={300}
                          placeholder="Reason (e.g. creator reported this wasn't them)"
                          aria-label="Reason for freezing"
                          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                        />
                      )}
                      <button type="submit" className="font-semibold text-destructive underline underline-offset-2">
                        {frozen ? "Unfreeze this creator's withdrawals" : "Freeze this creator's withdrawals"}
                      </button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
