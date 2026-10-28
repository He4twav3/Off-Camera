import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * One-off emails to every approved creator, such as a new campaign. Who has already had each one is kept as a
 * list of addresses in a private storage bucket, so pressing Send again (or after a time-out) only reaches the
 * ones still waiting: nobody gets a second copy. The bucket is made on first send, so there is no setup step.
 */
const BUCKET = "announcements";

export const MEPERSONA_ANNOUNCEMENT = "mepersona-2026-10";

export type Recipient = { email: string; name: string | null };

/** Every approved creator, one per email address. */
export async function approvedCreators(): Promise<Recipient[]> {
  const { data } = await createAdminClient().from("applicants").select("email, name").eq("status", "approved");
  const seen = new Map<string, Recipient>();
  for (const r of data ?? []) {
    const email = (r.email ?? "").trim().toLowerCase();
    if (email && !seen.has(email)) seen.set(email, { email, name: r.name });
  }
  return [...seen.values()];
}

/** The addresses that already have this announcement. */
export async function sentTo(key: string): Promise<Set<string>> {
  const { data, error } = await createAdminClient().storage.from(BUCKET).download(`${key}.json`);
  if (error || !data) return new Set();
  try {
    return new Set(JSON.parse(await data.text()) as string[]);
  } catch {
    return new Set();
  }
}

/** Saves the full list of addresses that have this announcement. */
export async function saveSentTo(key: string, emails: Set<string>): Promise<void> {
  const storage = createAdminClient().storage;
  const { data: existing } = await storage.getBucket(BUCKET);
  if (!existing) await storage.createBucket(BUCKET, { public: false });
  const body = new Blob([JSON.stringify([...emails])], { type: "application/json" });
  const { error } = await storage.from(BUCKET).upload(`${key}.json`, body, { upsert: true, contentType: "application/json" });
  if (error) console.error("announcements: couldn't save who was sent:", error.message);
}

/** The live MePersona campaign's page, or the campaign list when it can't be found. */
export async function mePersonaCampaignUrl(baseUrl: string): Promise<string> {
  const { data } = await createAdminClient()
    .from("jobs")
    .select("id")
    .ilike("title", "mepersona%")
    .eq("status", "open")
    .limit(1)
    .maybeSingle();
  return data ? `${baseUrl}/dashboard/recruiting/jobs/${data.id}` : `${baseUrl}/dashboard/recruiting/jobs`;
}
