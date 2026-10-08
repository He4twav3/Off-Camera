import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/admin-mfa";
import type { FeeRow } from "@/lib/fees";
import { FeesView } from "./FeesView";

export const metadata: Metadata = { title: "Fees · Admin" };

export default async function AdminFeesPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await props.searchParams;
  await requireAdminMfa("/admin/fees");
  const supabase = await createClient();

  // Every statement is one creator on one campaign. Only issued ones have a fee.
  const { data } = await supabase
    .from("assignments")
    .select(
      "id, applicants(name, handle), jobs(id, title, brand_account_id, brand_accounts(company_name)), direct_payments(id, amount, issued_at, due_at, our_fee, fee_received_at)",
    );

  // A creator can have several statements on a campaign (one per payment cycle).
  const rows: FeeRow[] = (data ?? []).flatMap((a) => {
    if (!a.jobs) return [];
    return a.direct_payments.map((dp) => ({
      id: dp.id,
      brandId: a.jobs.brand_account_id,
      brand: a.jobs.brand_accounts?.company_name ?? null,
      jobId: a.jobs.id,
      campaign: a.jobs.title,
      creator: a.applicants?.name ?? "Creator",
      handle: a.applicants?.handle ?? "",
      amount: Number(dp.amount),
      fee: Number(dp.our_fee),
      issuedAt: dp.issued_at,
      dueAt: dp.due_at,
      feeReceivedAt: dp.fee_received_at,
    }));
  });

  return <FeesView rows={rows} tab={tab} />;
}
