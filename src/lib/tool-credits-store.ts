import "server-only";
import { freshStorage } from "@/lib/supabase/fresh-storage";
import { markSent, unmarkSent, upsertRequest, type CreditProgram, type CreditRequest } from "@/lib/tool-credits";

/**
 * Each program's credit requests: one private file per program (affiliates/<key>/credits.json, next to the partner
 * codes), readable only with the service role, since it holds creators' emails.
 */
const BUCKET = "affiliates";
const path = (key: string) => `${key}/credits.json`;

async function bucket() {
  const store = freshStorage();
  const { data } = await store.getBucket(BUCKET);
  if (!data) await store.createBucket(BUCKET, { public: false });
  return store.from(BUCKET);
}

export async function readRequests(key: string): Promise<CreditRequest[]> {
  try {
    const { data, error } = await freshStorage().from(BUCKET).download(path(key));
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text()) as { requests?: CreditRequest[] };
    return Array.isArray(parsed.requests) ? parsed.requests : [];
  } catch {
    return [];
  }
}

async function writeRequests(key: string, requests: CreditRequest[]): Promise<boolean> {
  const body = new Blob([JSON.stringify({ v: 1, requests })], { type: "application/json" });
  const { error } = await (await bucket()).upload(path(key), body, { upsert: true, contentType: "application/json", cacheControl: "0" });
  return !error;
}

export async function requestFor(key: string, applicantId: string): Promise<CreditRequest | null> {
  return (await readRequests(key)).find((r) => r.applicantId === applicantId) ?? null;
}

/**
 * Saves a creator's account email. The file is read again after writing, so if two creators save at the same moment
 * and one write is lost, that creator's save is tried again.
 */
export async function saveRequest(program: CreditProgram, req: Omit<CreditRequest, "sentAt">): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const list = await readRequests(program.key);
    const next = upsertRequest(list, req);
    if (next !== list && !(await writeRequests(program.key, next))) return false;
    const check = (await readRequests(program.key)).find((r) => r.applicantId === req.applicantId);
    if (check?.toolEmail === req.toolEmail) return true;
  }
  return false;
}

export async function markRequestsSent(key: string, applicantIds: string[]): Promise<number | null> {
  const { list, marked } = markSent(await readRequests(key), applicantIds, new Date().toISOString());
  if (marked === 0) return 0;
  return (await writeRequests(key, list)) ? marked : null;
}

export async function unmarkRequestSent(key: string, applicantId: string): Promise<boolean> {
  return writeRequests(key, unmarkSent(await readRequests(key), applicantId));
}
