import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseFeeTerms, type FeeTerms } from "@/lib/fee";

/**
 * The fee set for each campaign (admin only: the table's policy lets only admins read it). Runs as the signed-in
 * admin. Tolerant: until migration 0026 has been run there is no table, and every campaign simply has no fee set.
 */
export async function getFeeBands(jobIds: string[]): Promise<{ terms: Map<string, FeeTerms>; available: boolean }> {
  const terms = new Map<string, FeeTerms>();
  if (jobIds.length === 0) return { terms, available: true };
  const supabase = (await createClient()) as unknown as {
    from: (n: string) => { select: (c: string) => { in: (k: string, v: string[]) => Promise<{ data: { job_id: string; bands: unknown }[] | null; error: unknown }> } };
  };
  const { data, error } = await supabase.from("campaign_fees").select("job_id, bands").in("job_id", jobIds);
  if (error) return { terms, available: false };
  for (const row of data ?? []) terms.set(row.job_id, parseFeeTerms(row.bands));
  return { terms, available: true };
}
