import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { statementState } from "@/lib/direct-pay";
import { StatementsView, type StatementRowData } from "./StatementsView";

export const metadata: Metadata = { title: "Statements · Admin" };

const norm = (v: string) => v.trim().replace(/^@+/, "").toLowerCase();

export default async function AdminStatementsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await props.searchParams;
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

  const rows: StatementRowData[] = (assignments ?? []).map((a) => {
    const terms = parsePayoutTerms(a.jobs?.payout_terms);
    const views = a.jobs && a.applicants ? (viewsByKey.get(`${norm(a.jobs.title)}|${norm(a.applicants.handle)}`) ?? 0) : 0;
    return {
      id: a.id,
      status: a.status,
      views,
      proof_url: a.proof_url,
      suggested: terms ? calculatePayout(terms, views).total : null,
      applicants: a.applicants,
      jobs: a.jobs ? { title: a.jobs.title, brand_accounts: a.jobs.brand_accounts } : null,
      direct_payments: a.direct_payments,
      state: a.direct_payments ? statementState(a.direct_payments) : null,
    };
  });

  return <StatementsView rows={rows} tab={tab} />;
}
