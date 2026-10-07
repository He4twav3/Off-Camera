import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { BRAND_METHODS, STATE_LABEL, statementState, type StatementState } from "@/lib/direct-pay";
import { IssueForm } from "./IssueForm";
import { adminMarkBrandPaidAction, toggleFeeReceivedAction, voidStatementAction } from "./actions";

export const metadata: Metadata = { title: "Statements · Admin" };

const STATE_TONE: Record<StatementState, StatusTone> = {
  awaiting_payment: "pending",
  overdue: "error",
  brand_says_paid: "pending",
  confirmed: "success",
  disputed: "error",
};

const norm = (v: string) => v.trim().replace(/^@+/, "").toLowerCase();

export default async function AdminStatementsPage() {
  await requireAdminMfa("/admin/statements");
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, status, proof_url, assigned_at, applicants(name, email, handle), jobs(title, payout_terms, brand_account_id, brand_accounts(company_name)), direct_payments(id, amount, issued_at, due_at, brand_paid_at, brand_method, brand_reference, creator_confirmed_at, creator_disputed_at, creator_dispute_note, our_fee, fee_received_at)",
    )
    .order("assigned_at", { ascending: false });

  const { data: viewRows } = await supabase.from("campaign_views").select("campaign, handle, views");
  const viewsByKey = new Map<string, number>();
  for (const r of viewRows ?? []) {
    const key = `${norm(r.campaign)}|${norm(r.handle)}`;
    viewsByKey.set(key, (viewsByKey.get(key) ?? 0) + Number(r.views));
  }

  const rows = (assignments ?? []).map((a) => {
    const terms = parsePayoutTerms(a.jobs?.payout_terms);
    const views = a.jobs && a.applicants ? (viewsByKey.get(`${norm(a.jobs.title)}|${norm(a.applicants.handle)}`) ?? 0) : 0;
    const suggested = terms ? calculatePayout(terms, views).total : null;
    return { ...a, views, suggested, state: a.direct_payments ? statementState(a.direct_payments) : null };
  });

  const ready = rows.filter((r) => r.status === "submitted" && !r.direct_payments);
  const withStatement = rows.filter((r) => r.direct_payments);
  const attention = withStatement.filter((r) => r.state === "disputed" || r.state === "overdue");
  const open = withStatement.filter((r) => r.state === "awaiting_payment" || r.state === "brand_says_paid");
  const done = withStatement.filter((r) => r.state === "confirmed");

  const owedToCreators = withStatement
    .filter((r) => r.state !== "confirmed")
    .reduce((n, r) => n + Number(r.direct_payments!.amount), 0);
  const feesOwedToUs = withStatement
    .filter((r) => !r.direct_payments!.fee_received_at)
    .reduce((n, r) => n + Number(r.direct_payments!.our_fee), 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Statements</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Brands pay creators directly. Here you issue the statement that says who owes what, and keep track of who has
          paid and what the brands owe us.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Brands still owe creators" value={formatCurrency(owedToCreators)} />
          <Stat label="Brands still owe us (our fees)" value={formatCurrency(feesOwedToUs)} />
          <Stat label="Ready for a statement" value={String(ready.length)} />
        </dl>
      </header>

      <div className="flex flex-col gap-10">
        {attention.length > 0 && (
          <Section title="Needs attention">
            {attention.map((r) => (
              <StatementCard key={r.id} row={r} />
            ))}
          </Section>
        )}

        {ready.length > 0 && (
          <Section title="Ready for a statement">
            {ready.map((r) => (
              <li key={r.id}>
                <Card className="border-border/70">
                  <CardContent>
                    <Who row={r} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.views.toLocaleString()} views counted so far
                      {r.suggested !== null && ` · formula says ${formatCurrency(r.suggested)}`}
                    </p>
                    {r.proof_url && (
                      <p className="mt-1 text-sm">
                        <a href={r.proof_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          Submitted post
                        </a>
                      </p>
                    )}
                    <div className="mt-4 border-t border-border pt-4">
                      <IssueForm assignmentId={r.id} suggestedAmount={r.suggested} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </Section>
        )}

        {open.length > 0 && (
          <Section title="Waiting on payment">
            {open.map((r) => (
              <StatementCard key={r.id} row={r} />
            ))}
          </Section>
        )}

        {done.length > 0 && (
          <Section title="Paid">
            {done.map((r) => (
              <StatementCard key={r.id} row={r} />
            ))}
          </Section>
        )}

        {ready.length + withStatement.length === 0 && (
          <Card className="border-border/70 py-12 text-center">
            <CardContent>
              <h2 className="font-heading text-xl font-semibold text-foreground">Nothing to do yet</h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
                When a creator submits their post it appears here, ready for a statement.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

type Row = {
  id: string;
  status: string;
  views: number;
  applicants: { name: string; email: string; handle: string } | null;
  jobs: { title: string; brand_account_id: string | null; brand_accounts: { company_name: string } | null } | null;
  direct_payments: {
    id: string;
    amount: number;
    issued_at: string;
    due_at: string;
    brand_paid_at: string | null;
    brand_method: string | null;
    brand_reference: string | null;
    creator_confirmed_at: string | null;
    creator_disputed_at: string | null;
    creator_dispute_note: string | null;
    our_fee: number;
    fee_received_at: string | null;
  } | null;
  state: StatementState | null;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-heading text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">{title}</h2>
      <ul className="flex flex-col gap-4">{children}</ul>
    </section>
  );
}

function Who({ row }: { row: Row }) {
  return (
    <>
      <h3 className="font-heading text-lg font-semibold text-foreground">{row.jobs?.title ?? "Campaign"}</h3>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {row.applicants?.name} (@{row.applicants?.handle}) · {row.applicants?.email}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Brand: {row.jobs?.brand_accounts?.company_name ?? "none attached. You'll need to record its payment yourself"}
      </p>
    </>
  );
}

function StatementCard({ row }: { row: Row }) {
  const dp = row.direct_payments!;
  const state = row.state!;
  return (
    <li>
      <Card className="border-border/70">
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <StatusBadge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</StatusBadge>
              <div className="mt-3">
                <Who row={row} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Issued {formatDate(dp.issued_at)} · due {formatDate(dp.due_at)}
                {dp.brand_paid_at && ` · brand marked paid ${formatDate(dp.brand_paid_at)}`}
                {dp.brand_method && ` (${dp.brand_method}${dp.brand_reference ? `, ${dp.brand_reference}` : ""})`}
                {dp.creator_confirmed_at && ` · creator confirmed ${formatDate(dp.creator_confirmed_at)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-muted-foreground">Brand owes creator</p>
              <p className="font-heading text-xl font-semibold text-primary">{formatCurrency(Number(dp.amount))}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our fee <span className="font-semibold text-foreground">{formatCurrency(Number(dp.our_fee))}</span>
                {dp.fee_received_at ? " · received" : Number(dp.our_fee) > 0 ? " · not received yet" : ""}
              </p>
            </div>
          </div>

          {dp.creator_disputed_at && (
            <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="font-semibold">Creator says they weren&apos;t paid</span> ({formatDate(dp.creator_disputed_at)}
              ): {dp.creator_dispute_note || "no note"}. Follow up with the brand.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-3 border-t border-border pt-4">
            {!dp.brand_paid_at && !dp.creator_confirmed_at && (
              <form action={adminMarkBrandPaidAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={dp.id} />
                <Field label="Brand told us it paid" htmlFor={`m-${dp.id}`}>
                  <Select id={`m-${dp.id}`} name="method" defaultValue={BRAND_METHODS[0]}>
                    {BRAND_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Reference (optional)" htmlFor={`r-${dp.id}`}>
                  <Input id={`r-${dp.id}`} name="reference" maxLength={200} />
                </Field>
                <Button type="submit" variant="outline" size="sm">
                  Record as paid
                </Button>
              </form>
            )}

            {Number(dp.our_fee) > 0 && (
              <form action={toggleFeeReceivedAction}>
                <input type="hidden" name="id" value={dp.id} />
                <Button type="submit" variant="outline" size="sm">
                  {dp.fee_received_at ? "Mark our fee as not received" : "Mark our fee as received"}
                </Button>
              </form>
            )}

            {!dp.brand_paid_at && !dp.creator_confirmed_at && (
              <form action={voidStatementAction}>
                <input type="hidden" name="id" value={dp.id} />
                <button
                  type="submit"
                  className="min-h-9 cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
                >
                  Void this statement
                </button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
