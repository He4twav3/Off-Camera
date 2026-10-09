import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FeeBand } from "@/lib/fee";

/**
 * The fee set for each campaign (admin only: the table's policy lets only admins read it). Runs as the signed-in
 * admin. Tolerant: until migration 0026 has been run there is no table, and every campaign simply has no fee set.
 */
export async function getFeeBands(jobIds: string[]): Promise<{ bands: Map<string, FeeBand[]>; available: boolean }> {
  const bands = new Map<string, FeeBand[]>();
  if (jobIds.length === 0) return { bands, available: true };
  const supabase = (await createClient()) as unknown as {
    from: (n: string) => { select: (c: string) => { in: (k: string, v: string[]) => Promise<{ data: { job_id: string; bands: FeeBand[] }[] | null; error: unknown }> } };
  };
  const { data, error } = await supabase.from("campaign_fees").select("job_id, bands").in("job_id", jobIds);
  if (error) return { bands, available: false };
  for (const row of data ?? []) bands.set(row.job_id, Array.isArray(row.bands) ? row.bands : []);
  return { bands, available: true };
}
