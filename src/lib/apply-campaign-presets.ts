import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPAIGN_PRESETS, presetMarker, presetRow } from "@/lib/campaign-presets";
import { parsePostTerms, postTermsSchema } from "@/lib/post-terms";
import { writeCampaignGuide } from "@/lib/campaign-guide-store";

/**
 * Puts each signed-off setup (lib/campaign-presets.ts) on its live campaign, once per version: a campaign whose terms
 * already record this version is left alone, so edits made afterwards in admin stay. Runs when a server starts
 * (src/instrumentation.ts), with the service role. Matches open and filled campaigns on their title or brand note.
 */
export async function applyCampaignPresets(): Promise<void> {
  const db = createAdminClient();
  for (const preset of CAMPAIGN_PRESETS) {
    const marker = presetMarker(preset);
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
      if (!preset.matches(job)) continue;
      const raw = job.post_terms as { preset?: unknown } | null;
      if (raw?.preset === marker) continue;
      const row = presetRow(preset, parsePostTerms(job.post_terms));
      const terms = postTermsSchema.safeParse(row.post_terms);
      if (!terms.success) {
        console.error(`campaign-presets: ${marker} has invalid pay terms`);
        continue;
      }
      const written = await writeCampaignGuide(job.id, { guide: preset.guide, scripts: preset.scripts });
      if (!written.ok) {
        console.error(`campaign-presets: couldn't save the guide for ${job.id}`);
        continue;
      }
      // Written last, so a failure above leaves the marker unset and the next start tries again.
      const { error: updateError } = await db
        .from("jobs")
        .update({ ...row, post_terms: terms.data as unknown as Record<string, unknown> })
        .eq("id", job.id);
      if (updateError) console.error(`campaign-presets: couldn't apply ${marker} to ${job.id}:`, updateError.message);
      else console.log(`campaign-presets: applied ${marker} to ${job.id}`);
    }
  }
}
