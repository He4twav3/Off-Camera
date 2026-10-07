import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { isDirectPay, statementState } from "@/lib/direct-pay";
import { adminNavGroups } from "@/lib/admin-nav";
import { OverviewView, type QueueItem } from "@/components/admin/overview-view";

export const metadata: Metadata = { title: "Overview · Admin" };

export default async function AdminHomePage() {
  const supabase = await createClient();
  const direct = isDirectPay();
  const count = { count: "exact", head: true } as const;

  // Counts only (`head: true` skips returning rows), plus the few small lists
  // the money numbers need.
  const [pendingApplicants, pendingApplications, pendingBrands, pendingSignups, openJobs, disputed, submitted] =
    await Promise.all([
      supabase.from("applicants").select("*", count).eq("status", "pending"),
      supabase.from("applications").select("*", count).eq("status", "pending"),
      supabase.from("brand_accounts").select("*", count).eq("status", "pending"),
      supabase.from("campaign_signups").select("*", count).eq("status", "pending"),
      supabase.from("jobs").select("*", count).eq("status", "open"),
      supabase.from("assignments").select("*", count).eq("status", "disputed"),
      supabase.from("assignments").select("id, applicant_payout_amount, direct_payments(id)").eq("status", "submitted"),
    ]);

  const n = (r: { count: number | null }) => r.count ?? 0;
  const submittedRows = submitted.data ?? [];

  const queue: QueueItem[] = [
    { label: "Applications to decide", value: String(n(pendingApplications)), href: "/admin/applications", urgent: n(pendingApplications) > 0 },
    { label: "Creators to review", value: String(n(pendingApplicants)), href: "/admin/applicants", urgent: n(pendingApplicants) > 0 },
    { label: "Brands to approve", value: String(n(pendingBrands)), href: "/admin/brands", urgent: n(pendingBrands) > 0 },
    { label: "Campaign signups to review", value: String(n(pendingSignups)), href: "/admin/campaigns", urgent: n(pendingSignups) > 0 },
  ];

  let summary: string;

  if (direct) {
    const { data: statementRows } = await supabase
      .from("direct_payments")
      .select("amount, due_at, brand_paid_at, creator_confirmed_at, creator_disputed_at, our_fee, fee_received_at");
    const statements = statementRows ?? [];
    const readyForStatement = submittedRows.filter((a) => !a.direct_payments).length;
    const needAttention = statements.filter((s) => {
      const state = statementState(s);
      return state === "overdue" || state === "disputed";
    }).length;
    const owedToCreators = statements.filter((s) => !s.creator_confirmed_at).reduce((sum, s) => sum + Number(s.amount), 0);
    const feesOutstanding = statements.filter((s) => !s.fee_received_at).reduce((sum, s) => sum + Number(s.our_fee), 0);

    queue.push(
      { label: "Ready for a statement", value: String(readyForStatement), href: "/admin/statements", urgent: readyForStatement > 0 },
      { label: "Statements needing attention", value: String(needAttention), href: "/admin/statements", urgent: needAttention > 0 },
      { label: "Our fees not yet received", value: formatCurrency(feesOutstanding), href: "/admin/fees", urgent: feesOutstanding > 0 },
    );
    summary = `${n(openJobs)} open ${n(openJobs) === 1 ? "campaign" : "campaigns"} · brands still owe creators ${formatCurrency(owedToCreators)}`;
  } else {
    const awaiting = submittedRows.length;
    const owed = submittedRows.reduce((sum, a) => sum + Number(a.applicant_payout_amount), 0);
    const withdrawals = await supabase.from("withdrawals").select("*", count).eq("status", "requested");
    queue.push(
      { label: "Posts awaiting payout", value: String(awaiting), href: "/admin/payouts", urgent: awaiting > 0 },
      { label: "Withdrawals to pay", value: String(n(withdrawals)), href: "/admin/withdrawals", urgent: n(withdrawals) > 0 },
    );
    summary = `${n(openJobs)} open ${n(openJobs) === 1 ? "campaign" : "campaigns"} · ${formatCurrency(owed)} owed out to creators`;
  }

  // With direct payment a dispute is a creator reporting a missing payment,
  // already counted under "Statements needing attention".
  if (!direct) {
    queue.push({ label: "Disputes open", value: String(n(disputed)), href: "/admin/payouts", urgent: n(disputed) > 0 });
  }

  return <OverviewView summary={summary} queue={queue} groups={adminNavGroups(direct)} />;
}
