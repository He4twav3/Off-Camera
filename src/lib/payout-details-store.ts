import "server-only";
import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptDetails, encryptDetails } from "@/lib/secret-box";
import { bankSummary, type BankDetails } from "@/lib/bank-details";

/**
 * Where creators' bank details live: one encrypted file per creator in a private storage
 * bucket, readable only with the service role. The key is never stored with them: it is
 * PAYOUT_DETAILS_KEY (32 bytes, base64) when set, otherwise derived from the service-role
 * key, so a copy of the storage files alone reveals nothing. The applicant row keeps only a
 * safe summary ("Bank account in EUR · IBAN ending 1234"), which is what brands and admin
 * pages show. The full details only ever leave in the Wise payment file for the brand that
 * owes the creator.
 *
 * Also kept here: each brand's blank Wise template, the list of payments in the last file it
 * downloaded, and the Wise confirmations brands upload.
 */
const BUCKET = "payout-details";

function payoutKey(): Buffer {
  const own = process.env.PAYOUT_DETAILS_KEY;
  if (own) {
    const k = Buffer.from(own, "base64");
    if (k.length !== 32) throw new Error("PAYOUT_DETAILS_KEY must be 32 bytes, base64 encoded");
    return k;
  }
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) throw new Error("No key to encrypt payout details with");
  return createHmac("sha256", service).update("oncamera:payout-details:v1").digest();
}

async function bucket() {
  const storage = createAdminClient().storage;
  const { data } = await storage.getBucket(BUCKET);
  if (!data) await storage.createBucket(BUCKET, { public: false });
  return storage.from(BUCKET);
}

async function readText(path: string): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient().storage.from(BUCKET).download(path);
    if (error || !data) return null;
    return await data.text();
  } catch {
    return null;
  }
}

async function writeText(path: string, text: string, contentType: string): Promise<boolean> {
  const { error } = await (await bucket()).upload(path, new Blob([text], { type: contentType }), { upsert: true, contentType });
  return !error;
}

const creatorPath = (applicantId: string) => `creators/${applicantId}.json`;

/** Saves a creator's details and the safe summary on their applicant row. */
export async function saveBankDetails(applicantId: string, details: BankDetails): Promise<boolean> {
  const summary = bankSummary(details);
  const file = { v: 1, box: encryptDetails(JSON.stringify(details), payoutKey()), summary, updatedAt: new Date().toISOString() };
  if (!(await writeText(creatorPath(applicantId), JSON.stringify(file), "application/json"))) return false;
  const { error } = await createAdminClient().from("applicants").update({ payout_instructions: summary }).eq("id", applicantId);
  return !error;
}

export async function removeBankDetails(applicantId: string): Promise<boolean> {
  await createAdminClient().storage.from(BUCKET).remove([creatorPath(applicantId)]);
  const { error } = await createAdminClient().from("applicants").update({ payout_instructions: null }).eq("id", applicantId);
  return !error;
}

/** The full details, for the Wise file only. Null when there are none (or they can't be read). */
export async function readBankDetails(applicantId: string): Promise<BankDetails | null> {
  const text = await readText(creatorPath(applicantId));
  if (!text) return null;
  try {
    const file = JSON.parse(text) as { box?: string };
    return file.box ? (JSON.parse(decryptDetails(file.box, payoutKey())) as BankDetails) : null;
  } catch (e) {
    console.error("payout-details: couldn't read details for", applicantId, e instanceof Error ? e.message : e);
    return null;
  }
}

/** The creator's own saved details with the account parts masked, for their form. */
export async function readMaskedDetails(applicantId: string): Promise<{ summary: string; details: BankDetails } | null> {
  const details = await readBankDetails(applicantId);
  if (!details) return null;
  const mask = (v: string) => (v.length > 4 ? `•••• ${v.slice(-4)}` : v);
  const bank = Object.fromEntries(Object.entries(details.bank).map(([k, v]) => [k, k === "accountType" || k === "bic" ? v : mask(v ?? "")]));
  return { summary: bankSummary(details), details: { ...details, bank } };
}

// The brand's Wise template, as the CSV Wise gave it.
export const readWiseTemplate = (brandId: string) => readText(`templates/${brandId}.csv`);
export const saveWiseTemplate = (brandId: string, text: string) => writeText(`templates/${brandId}.csv`, text, "text/csv");

/** The payments in the last Wise file a brand downloaded, so "I've paid it" marks exactly those. */
export type LastBatch = { statementIds: string[]; total: number; createdAt: string };
export async function readLastBatch(brandId: string): Promise<LastBatch | null> {
  const text = await readText(`batches/${brandId}/last.json`);
  try {
    return text ? (JSON.parse(text) as LastBatch) : null;
  } catch {
    return null;
  }
}
export const saveLastBatch = (brandId: string, batch: LastBatch) =>
  writeText(`batches/${brandId}/last.json`, JSON.stringify(batch), "application/json");

/** Keeps the brand's Wise confirmation (screenshot or PDF) for both sides' records. */
export async function saveConfirmation(brandId: string, file: File): Promise<string | null> {
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `confirmations/${brandId}/${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
  const { error } = await (await bucket()).upload(path, file, { contentType: file.type });
  return error ? null : path;
}
