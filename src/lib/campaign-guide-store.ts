import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Where a campaign's product guide and scripts are kept: two text files in a private storage bucket, one folder per
 * campaign. They can run to many thousands of characters, more than the campaign row's own text fields take, and
 * storage needs no database change. The bucket is made on first save, so there is no setup step in Supabase. Only
 * the server reads and writes it (with the service role): the page shows what an admin saved, and only the admin
 * form saves.
 */
export const CAMPAIGN_GUIDE_BUCKET = "campaign-briefs";

export type CampaignGuide = { guide: string; scripts: string };

const FILES = { guide: "guide.txt", scripts: "scripts.txt" } as const;
const path = (jobId: string, part: keyof CampaignGuide) => `${jobId}/${FILES[part]}`;

/** The saved guide and scripts; empty text when there are none, or when storage can't be reached. */
export async function readCampaignGuide(jobId: string): Promise<CampaignGuide> {
  const bucket = createAdminClient().storage.from(CAMPAIGN_GUIDE_BUCKET);
  const read = async (part: keyof CampaignGuide) => {
    const { data, error } = await bucket.download(path(jobId, part));
    if (error || !data) return "";
    return data.text();
  };
  const [guide, scripts] = await Promise.all([read("guide"), read("scripts")]);
  return { guide, scripts };
}

/** Saves both texts; an empty text removes its file. */
export async function writeCampaignGuide(jobId: string, docs: CampaignGuide): Promise<{ ok: true } | { ok: false; error: string }> {
  const storage = createAdminClient().storage;
  const { data: existing } = await storage.getBucket(CAMPAIGN_GUIDE_BUCKET);
  if (!existing) {
    const { error } = await storage.createBucket(CAMPAIGN_GUIDE_BUCKET, { public: false });
    if (error && !/exist/i.test(error.message)) {
      console.error("campaign-briefs: couldn't create the bucket:", error.message);
      return { ok: false, error: "We couldn't save the guide and scripts. Please try again." };
    }
  }
  const bucket = storage.from(CAMPAIGN_GUIDE_BUCKET);
  for (const part of ["guide", "scripts"] as const) {
    const text = docs[part].trim();
    const { error } = text
      ? await bucket.upload(path(jobId, part), new Blob([text], { type: "text/plain;charset=utf-8" }), { upsert: true, contentType: "text/plain;charset=utf-8" })
      : await bucket.remove([path(jobId, part)]);
    if (error) {
      console.error(`campaign-briefs: couldn't save the ${part}:`, error.message);
      return { ok: false, error: "We couldn't save the guide and scripts. Please try again." };
    }
  }
  return { ok: true };
}
