import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MIN_WITHDRAWAL, sumMoney } from "@/lib/balance";
import { WithdrawForm } from "./WithdrawForm";

export const metadata: Metadata = { title: "Earnings" };

const WITHDRAWAL_TONE = { requested: "pending", paid: "success", rejected: "error" } as const;
const WITHDRAWAL_LABEL = { requested: "Being processed", paid: "Paid", rejected: "Not paid" } as const;

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruiting/earnings");

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!applicant) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Earnings</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Set up your creator profile first.{" "}
          <Link href="/dashboard/recruiting/profile-setup" className="font-semibold text-primary underline underline-offset-2">
            Start your profile
          </Link>
        </p>
      </div>
    );
  }

  // RLS limits both tables to this creator's own rows.
  const [{ data: entries }, { data: withdrawals }] = await Promise.all([
    supabase
      .from("balance_entries")
      .select("id, amount, kind, note, created_at, assignments(jobs(title))")
      .eq("applicant_id", applicant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select("id, amount, status, created_at, decided_at, admin_note")
      .eq("applicant_id", applicant.id)
      .order("created_at", { ascending: false }),
  ]);

  const ledger = entries ?? [];
  const requests = withdrawals ?? [];
  const available = sumMoney(ledger.map((e) => Number(e.amount)));
  const processing = sumMoney(requests.filter((w) => w.status === "requested").map((w) => Number(w.amount)));
  const withdrawn = sumMoney(requests.filter((w) => w.status === "paid").map((w) => Number(w.amount)));
  const earnedTotal = sumMoney(ledger.filter((e) => e.kind === "earning").map((e) => Number(e.amount)));
  const canWithdraw = applicant.status === "approved" && available >= MIN_WITHDRAWAL;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:py-10">
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Earnings</h1>
      <p className="mt-1 text-[15px] text-muted-foreground">
        Your pay for each campaign is added here once the brand has paid us and your post is approved.
      </p>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Available to withdraw" value={formatCurrency(available)} accent />
        <Stat label="Being processed" value={formatCurrency(processing)} />
        <Stat label="Withdrawn to date" value={formatCurrency(withdrawn)} />
      </dl>
      <p className="mt-2 text-sm text-muted-foreground">Earned in total: {formatCurrency(earnedTotal)}</p>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Withdraw</h2>
        <Card className="border-border/70">
          <CardContent>
            {canWithdraw ? (
              <WithdrawForm available={available} />
            ) : (
              <p className="text-[15px] text-muted-foreground">
                {applicant.status !== "approved"
                  ? "You can withdraw once your profile has been approved."
                  : `You can withdraw once your balance reaches $${MIN_WITHDRAWAL}.`}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              We review each request and pay it by bank transfer. It can take a few business days, and we email you when it&apos;s paid.
            </p>
          </CardContent>
        </Card>
      </section>

      {requests.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Your withdrawals</h2>
          <ul className="flex flex-col gap-3">
            {requests.map((w) => (
              <li key={w.id}>
                <Card className="border-border/70">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrency(w.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Requested {formatDate(w.created_at)}
                        {w.decided_at ? ` · decided ${formatDate(w.decided_at)}` : ""}
                      </p>
                      {w.status === "rejected" && w.admin_note && (
                        <p className="mt-1 text-sm text-muted-foreground">{w.admin_note}</p>
                      )}
                    </div>
                    <StatusBadge tone={WITHDRAWAL_TONE[w.status]}>{WITHDRAWAL_LABEL[w.status]}</StatusBadge>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Balance history</h2>
        {ledger.length === 0 ? (
          <Card className="border-border/70">
            <CardContent>
              <p className="text-[15px] text-muted-foreground">
                Nothing here yet. Your first campaign pay will show up when it&apos;s released.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border/70 bg-card">
            {ledger.map((e) => {
              const jobTitle = e.assignments?.jobs?.title;
              const label =
                e.kind === "earning"
                  ? `Earned${jobTitle ? `: ${jobTitle}` : ""}`
                  : e.kind === "withdrawal"
                    ? "Withdrawal requested"
                    : (e.note ?? "Adjustment");
              const positive = Number(e.amount) > 0;
              return (
                <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(e.created_at)}</p>
                  </div>
                  <p className={positive ? "font-semibold text-toy-soft-foreground" : "font-semibold text-foreground"}>
                    {positive ? "+" : "−"}
                    {formatCurrency(Math.abs(Number(e.amount)))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-4 py-3.5">
      <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
      <dd className={accent ? "mt-1 font-heading text-2xl font-semibold text-primary" : "mt-1 font-heading text-2xl font-semibold text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
