import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPAIGN_PRESETS, presetFor, presetMarker, presetRow, type CampaignPreset } from "@/lib/campaign-presets";
import { parsePostTerms, postTermsSchema } from "@/lib/post-terms";
import { readCampaignGuide, writeCampaignGuide } from "@/lib/campaign-guide-store";

type Db = ReturnType<typeof createAdminClient>;
type JobRow = { id: string; title: string; about: string | null; post_terms: unknown };

export type PresetResult = { preset: string; applied: boolean; error?: string };

/**
 * Writes one setup to one campaign: the campaign row first (its version recorded in the terms), then the guide and
 * scripts. With the service role, so it only ever runs on the server for a setup written into the code.
 */
async function applyTo(db: Db, preset: CampaignPreset, job: JobRow): Promise<PresetResult> {
  const marker = presetMarker(preset);
  const row = presetRow(preset, parsePostTerms(job.post_terms));
  const terms = postTermsSchema.safeParse(row.post_terms);
  if (!terms.success) return { preset: marker, applied: false, error: "The setup's pay terms aren't valid." };
  const { error } = await db
    .from("jobs")
    .update({ ...row, post_terms: terms.data as unknown as Record<string, unknown> })
    .eq("id", job.id);
  if (error) return { preset: marker, applied: false, error: `Couldn't update the campaign: ${error.message}` };
  const written = await writeCampaignGuide(job.id, { guide: preset.guide, scripts: preset.scripts });
  if (!written.ok) return { preset: marker, applied: true, error: `Campaign updated, but the guide and scripts weren't saved: ${written.error}` };
  console.log(`campaign-presets: applied ${marker} to ${job.id}`);
  return { preset: marker, applied: true };
}

/**
 * Makes sure one campaign carries the current version of its setup, if it has one: applied when the version differs,
 * and the guide and scripts saved again if they went missing. Called as a campaign page loads, so the setup is live
 * the first time anyone opens it. Returns null for a campaign with no setup. Never throws.
 */
export async function ensureCampaignPreset(jobId: string): Promise<PresetResult | null> {
  try {
    const db = createAdminClient();
    const { data: job } = await db.from("jobs").select("id, title, about, status, post_terms").eq("id", jobId).maybeSingle();
    if (!job || job.status === "closed") return null;
    const preset = presetFor(job);
    if (!preset) return null;
    const marker = presetMarker(preset);
    if ((job.post_terms as { preset?: unknown } | null)?.preset !== marker) return await applyTo(db, preset, job);
    const saved = await readCampaignGuide(job);
    if (!saved.guide || !saved.scripts) {
      const written = await writeCampaignGuide(job.id, { guide: preset.guide, scripts: preset.scripts });
      if (!written.ok) return { preset: marker, applied: true, error: `The guide and scripts weren't saved: ${written.error}` };
    }
    return { preset: marker, applied: true };
  } catch (e) {
    return { preset: "?", applied: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Every setup on its open campaigns, once per version. Runs when a server starts (src/instrumentation.ts). */
export async function applyCampaignPresets(): Promise<void> {
  const db = createAdminClient();
  for (const preset of CAMPAIGN_PRESETS) {
    const { data: jobs, error } = await db
      .from("jobs")
      .select("id, title, about, status, post_terms")
      .neq("status", "closed")
      .or(`title.ilike.%${preset.key}%,about.ilike.%${preset.key}%`);
    if (error) {
      console.error(`campaign-presets: couldn't look up ${preset.key}:`, error.message);
      continue;
    }
    for (const job of jobs ?? []) {
      if (!preset.matches(job) || (job.post_terms as { preset?: unknown } | null)?.preset === presetMarker(preset)) continue;
      const result = await applyTo(db, preset, job);
      if (result.error) console.error(`campaign-presets: ${job.id}: ${result.error}`);
    }
  }
}

/**
 * Marks a campaign's setup as done after someone edits the campaign by hand, so the setup never puts its own
 * version back over their changes (it is applied again only when its version in the code goes up). Never throws.
 */
export async function markPresetDone(jobId: string): Promise<void> {
  try {
    const db = createAdminClient();
    const { data: job } = await db.from("jobs").select("id, title, about, post_terms").eq("id", jobId).maybeSingle();
    if (!job) return;
    const preset = presetFor(job);
    const terms = job.post_terms as Record<string, unknown> | null;
    if (!preset || !terms || terms.preset === presetMarker(preset)) return;
    await db.from("jobs").update({ post_terms: { ...terms, preset: presetMarker(preset) } }).eq("id", jobId);
  } catch (e) {
    console.error("campaign-presets: couldn't mark a hand-edited campaign:", e instanceof Error ? e.message : e);
  }
}
