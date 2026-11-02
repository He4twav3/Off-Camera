import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { freshStorage } from "@/lib/supabase/fresh-storage";
import { heldBy, mergeCodes, nextFree, type AffiliateCode, type AffiliateProgram } from "@/lib/affiliate-programs";

/**
 * Each program's partner codes and who they went to: one private file per program (affiliates/<key>/codes.json),
 * readable only with the service role. The codes are the brand's and must stay private, so they are uploaded by an
 * admin (Admin → Affiliates) and never kept in the code. A creator on the campaign is given the next unused code the
 * first time they open Affiliates, and keeps it.
 */
const BUCKET = "affiliates";
const path = (key: string) => `${key}/codes.json`;

async function bucket() {
  const store = freshStorage();
  const { data } = await store.getBucket(BUCKET);
  if (!data) await store.createBucket(BUCKET, { public: false });
  return store.from(BUCKET);
}

export async function readCodes(key: string): Promise<AffiliateCode[]> {
  try {
    const { data, error } = await freshStorage().from(BUCKET).download(path(key));
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text()) as { codes?: AffiliateCode[] };
    return Array.isArray(parsed.codes) ? parsed.codes : [];
  } catch {
    return [];
  }
}

async function writeCodes(key: string, codes: AffiliateCode[]): Promise<boolean> {
  const body = new Blob([JSON.stringify({ v: 1, codes })], { type: "application/json" });
  const { error } = await (await bucket()).upload(path(key), body, { upsert: true, contentType: "application/json", cacheControl: "0" });
  return !error;
}

/** Adds the codes from the brand's list; codes already given out are left exactly as they are. */
export async function importCodes(
  key: string,
  incoming: AffiliateCode[],
): Promise<{ ok: boolean; added: number; total: number; error?: string }> {
  const { codes, added } = mergeCodes(await readCodes(key), incoming);
  if (added === 0) return { ok: true, added, total: codes.length };
  const body = new Blob([JSON.stringify({ v: 1, codes })], { type: "application/json" });
  const { error } = await (await bucket()).upload(path(key), body, { upsert: true, contentType: "application/json", cacheControl: "0" });
  return { ok: !error, added, total: codes.length, error: error?.message };
}

export type CodeResult = { code: AffiliateCode } | { none: "not_uploaded" | "all_given" | "error" };

/**
 * The creator's code: the one they already hold, or the next unused one. The file is read again after writing, so
 * two creators given a code at the same moment can't both end up with the same one: whoever lost the race tries
 * again with the next.
 */
export async function codeFor(program: AffiliateProgram, applicant: { id: string; name: string; email: string }): Promise<CodeResult> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const codes = await readCodes(program.key);
    const held = heldBy(codes, applicant.id);
    if (held) return { code: held };
    if (codes.length === 0) return { none: "not_uploaded" };
    const free = nextFree(codes);
    if (!free) return { none: "all_given" };
    const given: AffiliateCode = { ...free, status: "given", applicantId: applicant.id, name: applicant.name, email: applicant.email, givenAt: new Date().toISOString() };
    if (!(await writeCodes(program.key, codes.map((c) => (c.code === free.code ? given : c))))) return { none: "error" };
    const check = heldBy(await readCodes(program.key), applicant.id);
    if (check) return { code: check };
  }
  return { none: "error" };
}

/** Saves the personal link the creator got from the brand next to their code. */
export async function saveLink(key: string, applicantId: string, link: string): Promise<boolean> {
  const codes = await readCodes(key);
  if (!heldBy(codes, applicantId)) return false;
  return writeCodes(key, codes.map((c) => (c.status === "given" && c.applicantId === applicantId ? { ...c, link } : c)));
}

/** Takes a code out of use (lost, shared, or not working). Its creator is given the next one when they next look. */
export async function retireCode(key: string, code: string): Promise<boolean> {
  const codes = await readCodes(key);
  if (!codes.some((c) => c.code === code && c.status !== "retired")) return false;
  return writeCodes(key, codes.map((c) => (c.code === code ? { ...c, status: "retired" as const, retiredAt: new Date().toISOString() } : c)));
}

/** Each creator's videos and views on the program's campaigns (rejected posts left out), for the brand's report. */
export async function resultsFor(program: AffiliateProgram, applicantIds: string[]): Promise<Map<string, { posts: number; views: number }>> {
  const out = new Map<string, { posts: number; views: number }>();
  if (applicantIds.length === 0) return out;
  const { data } = await createAdminClient()
    .from("assignments")
    .select("applicant_id, jobs(title, about), assignment_posts(state, views)")
    .in("applicant_id", applicantIds);
  for (const a of data ?? []) {
    if (!a.jobs || !program.matches(a.jobs)) continue;
    const counted = (a.assignment_posts ?? []).filter((p) => p.state !== "rejected");
    const prev = out.get(a.applicant_id) ?? { posts: 0, views: 0 };
    out.set(a.applicant_id, { posts: prev.posts + counted.length, views: prev.views + counted.reduce((s, p) => s + Number(p.views), 0) });
  }
  return out;
}
