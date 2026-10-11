import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseFeeTerms, STANDARD_FEE, type FeeTerms } from "@/lib/fee";

/**
 * The fee for each campaign. Every campaign has one: the standard fee (lib/fee.ts), unless an admin has set a different
 * one for that campaign (admin-only table campaign_fees, migration 0026). Runs as the signed-in admin. Without that
 * table everything simply uses the standard fee.
 */
export async function getFeeBands(
  jobIds: string[],
): Promise<{ terms: Map<string, FeeTerms>; custom: Set<string>; available: boolean }> {
  const terms = new Map<string, FeeTerms>(jobIds.map((id) => [id, STANDARD_FEE]));
  const custom = new Set<string>();
  if (jobIds.length === 0) return { terms, custom, available: true };
  const supabase = (await createClient()) as unknown as {
    from: (n: string) => { select: (c: string) => { in: (k: string, v: string[]) => Promise<{ data: { job_id: string; bands: unknown }[] | null; error: unknown }> } };
  };
  const { data, error } = await supabase.from("campaign_fees").select("job_id, bands").in("job_id", jobIds);
  if (error) return { terms, custom, available: false };
  for (const row of data ?? []) {
    terms.set(row.job_id, parseFeeTerms(row.bands));
    custom.add(row.job_id);
  }
  return { terms, custom, available: true };
}
