import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What creators and brands may see of a statement. `direct_payments` is
 * admin-only under RLS because it also holds our own fee, so these read it
 * with the service role and (a) select columns explicitly, never `our_fee` or
 * `fee_received_at`, and (b) filter to the caller's own rows. Callers pass an
 * applicant or brand id they have already tied to the signed-in user.
 */

export type CreatorStatement = {
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
  campaign: string;
  brand: string | null;
};

export async function getCreatorStatements(applicantId: string): Promise<CreatorStatement[]> {
  const { data } = await createAdminClient()
    .from("direct_payments")
    .select(
      "id, amount, issued_at, due_at, brand_paid_at, brand_method, brand_reference, creator_confirmed_at, creator_disputed_at, creator_dispute_note, assignments!inner(applicant_id, jobs(title, brand_accounts(company_name)))",
    )
    .eq("assignments.applicant_id", applicantId)
    .order("issued_at", { ascending: false });

  return (data ?? [])
    .filter((row) => row.assignments?.applicant_id === applicantId)
    .map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      issued_at: row.issued_at,
      due_at: row.due_at,
      brand_paid_at: row.brand_paid_at,
      brand_method: row.brand_method,
      brand_reference: row.brand_reference,
      creator_confirmed_at: row.creator_confirmed_at,
      creator_disputed_at: row.creator_disputed_at,
      creator_dispute_note: row.creator_dispute_note,
      campaign: row.assignments?.jobs?.title ?? "Campaign",
      brand: row.assignments?.jobs?.brand_accounts?.company_name ?? null,
    }));
}

export type BrandStatement = {
  id: string;
  amount: number;
  issued_at: string;
  due_at: string;
  brand_paid_at: string | null;
  brand_method: string | null;
  brand_reference: string | null;
  creator_confirmed_at: string | null;
  creator_disputed_at: string | null;
  campaign: string;
  creatorName: string;
  creatorHandle: string;
  /** Where the creator asked to be paid. Shown only to the brand that owes them. */
  payTo: string | null;
};

export async function getBrandStatements(brandId: string): Promise<BrandStatement[]> {
  const { data } = await createAdminClient()
    .from("direct_payments")
    .select(
      "id, amount, issued_at, due_at, brand_paid_at, brand_method, brand_reference, creator_confirmed_at, creator_disputed_at, assignments!inner(applicants(name, handle, payout_instructions), jobs!inner(title, brand_account_id))",
    )
    .eq("assignments.jobs.brand_account_id", brandId)
    .order("issued_at", { ascending: false });

  return (data ?? [])
    .filter((row) => row.assignments?.jobs?.brand_account_id === brandId)
    .map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      issued_at: row.issued_at,
      due_at: row.due_at,
      brand_paid_at: row.brand_paid_at,
      brand_method: row.brand_method,
      brand_reference: row.brand_reference,
      creator_confirmed_at: row.creator_confirmed_at,
      creator_disputed_at: row.creator_disputed_at,
      campaign: row.assignments?.jobs?.title ?? "Campaign",
      creatorName: row.assignments?.applicants?.name ?? "Creator",
      creatorHandle: row.assignments?.applicants?.handle ?? "",
      payTo: row.assignments?.applicants?.payout_instructions ?? null,
    }));
}
