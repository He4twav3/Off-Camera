import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPAIGN_PRESETS, presetFor, presetMarker, presetRow, type CampaignPreset } from "@/lib/campaign-presets";
import { parsePostTerms, postTermsSchema } from "@/lib/post-terms";
import { readCampaignGuide, writeCampaignGuide } from "@/lib/campaign-guide-store";

type Db = ReturnType<typeof createAdminClient>;
type JobRow = {
  id: string;
  title: string;
  about: string | null;
  description: string | null;
  example_urls: string[] | null;
  sample_required: boolean | null;
  sample_criteria: string | null;
  post_terms: unknown;
};

const JOB_FIELDS = "id, title, about, description, example_urls, sample_required, sample_criteria, status, post_terms";

export type PresetResult = { preset: string; applied: boolean; error?: string };

/** A short fingerprint of a value, the same for the same content whatever order its keys are in. */
export function fingerprint(value: unknown): string {
  const text = JSON.stringify(value ?? null, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b)))
      : typeof v === "string"
        ? v.trim()
        : v,
  );
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}:${(h >>> 0).toString(36)}`;
}

/**
 * Which parts of a campaign the setup may write, part by part, without ever undoing a hand edit. Each part the setup
 * wrote is fingerprinted. A part is written when it is the campaign's first setup, or when the live value still
 * matches what the setup last wrote; a part someone changed since (in Edit, the pay terms page, or the brand's own
 * editor) is left exactly as they made it, and keeps its old fingerprint so it is never written again. The only
 * exception is a part the owner explicitly asked to change in this version (`requested`). Pure, so the tests check it.
 */
export function planParts(
  parts: Record<string, { live: unknown; next: unknown }>,
  stored: Record<string, string>,
  firstTime: boolean,
  requested: string[] = [],
): { write: Set<string>; fingerprints: Record<string, string> } {
  const fingerprints = { ...stored };
  const write = new Set<string>();
  for (const [name, { live, next }] of Object.entries(parts)) {
    if (fingerprint(live) === fingerprint(next)) fingerprints[name] = fingerprint(next);
    else if (firstTime || stored[name] === fingerprint(live) || requested.includes(name)) {
      write.add(name);
      fingerprints[name] = fingerprint(next);
    }
  }
  return { write, fingerprints };
}

/** Brings one campaign up to its setup, writing only the parts nobody has edited by hand (see planParts). */
async function applyTo(db: Db, preset: CampaignPreset, job: JobRow): Promise<PresetResult> {
  const marker = presetMarker(preset);
  const liveTerms = parsePostTerms(job.post_terms);
  const firstTime = !liveTerms?.preset?.startsWith(`${preset.key}@`);
  const row = presetRow(preset, liveTerms);
  const saved = await readCampaignGuide(job);

  const payKeys = preset.postTerms ? Object.keys(preset.postTerms) : [];
  const pick = (t: object | null) => (t ? Object.fromEntries(payKeys.map((k) => [k, (t as Record<string, unknown>)[k]])) : null);
  const parts: Record<string, { live: unknown; next: unknown }> = {
    about: { live: job.about, next: row.about },
    description: { live: job.description, next: row.description },
    guide: { live: saved.guide, next: preset.guide },
    scripts: { live: saved.scripts, next: preset.scripts },
  };
  if ("example_urls" in row) parts.examples = { live: job.example_urls ?? [], next: row.example_urls };
  if ("sample_required" in row) parts.sample = { live: [job.sample_required, job.sample_criteria], next: [row.sample_required, row.sample_criteria] };
  if (preset.postTerms) parts.pay = { live: pick(liveTerms), next: pick(preset.postTerms) };

  const requested = preset.requested?.version === preset.version ? preset.requested.parts : [];
  const { write, fingerprints } = planParts(parts, liveTerms?.presetFields ?? {}, firstTime, requested);

  const update: Record<string, unknown> = {};
  if (write.has("about")) update.about = row.about;
  if (write.has("description")) Object.assign(update, { description: row.description, formats: row.formats });
  if (write.has("examples") && "example_urls" in row) update.example_urls = row.example_urls;
  if (write.has("sample") && "sample_required" in row) Object.assign(update, { sample_required: row.sample_required, sample_criteria: row.sample_criteria });
  if (write.has("pay") && "payout_amount" in row) update.payout_amount = row.payout_amount;
  // New pay goes on top of what is live, so the requirements, who reviews posts and the brand's contract stay.
  const baseTerms = write.has("pay") ? { ...(liveTerms ?? row.post_terms), ...pick(preset.postTerms ?? null) } : liveTerms;
  const terms = postTermsSchema.safeParse({ ...baseTerms, preset: marker, presetFields: fingerprints });
  if (!terms.success) return { preset: marker, applied: false, error: "The setup's pay terms aren't valid." };
  update.post_terms = terms.data as unknown as Record<string, unknown>;

  const { error } = await db.from("jobs").update(update as never).eq("id", job.id);
  if (error) return { preset: marker, applied: false, error: `Couldn't update the campaign: ${error.message}` };
  if (write.has("guide") || write.has("scripts")) {
    const written = await writeCampaignGuide(job.id, {
      guide: write.has("guide") ? preset.guide : saved.guide,
      scripts: write.has("scripts") ? preset.scripts : saved.scripts,
    });
    if (!written.ok) return { preset: marker, applied: true, error: `Campaign updated, but the guide and scripts weren't saved: ${written.error}` };
  }
  console.log(`campaign-presets: ${marker} on ${job.id}: wrote ${[...write].join(", ") || "nothing"}`);
  return { preset: marker, applied: true };
}

/** True when the campaign is already on this version of its setup, with its parts fingerprinted. */
function upToDate(preset: CampaignPreset, postTerms: unknown): boolean {
  const t = postTerms as { preset?: unknown; presetFields?: unknown } | null;
  return t?.preset === presetMarker(preset) && !!t.presetFields;
}

/**
 * Makes sure one campaign carries the current version of its setup, if it has one. Called as a campaign page loads,
 * so a new version is live the first time anyone opens it. Returns null for a campaign with no setup. Never throws.
 */
export async function ensureCampaignPreset(jobId: string): Promise<PresetResult | null> {
  try {
    const db = createAdminClient();
    const { data: job } = await db.from("jobs").select(JOB_FIELDS).eq("id", jobId).maybeSingle();
    if (!job || job.status === "closed") return null;
    const preset = presetFor(job);
    if (!preset) return null;
    if (upToDate(preset, job.post_terms)) return { preset: presetMarker(preset), applied: true };
    return await applyTo(db, preset, job as JobRow);
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
      .select(JOB_FIELDS)
      .neq("status", "closed")
      .or(`title.ilike.%${preset.key}%,about.ilike.%${preset.key}%`);
    if (error) {
      console.error(`campaign-presets: couldn't look up ${preset.key}:`, error.message);
      continue;
    }
    for (const job of jobs ?? []) {
      if (!preset.matches(job) || upToDate(preset, job.post_terms)) continue;
      const result = await applyTo(db, preset, job as JobRow);
      if (result.error) console.error(`campaign-presets: ${job.id}: ${result.error}`);
    }
  }
}
