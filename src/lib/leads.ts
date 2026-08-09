import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

/**
 * Real lead capture for this demo build: emails are appended to a local
 * JSONL file rather than dropped on the floor. There's no ESP/CRM wired up
 * (no Mailchimp/Klaviyo/ConvertKit API key configured anywhere), so this is
 * the honest local equivalent — swap `saveLead` for a real API call before
 * going live. `data/*.jsonl` is gitignored: these are real visitor emails,
 * never commit them.
 */
const LEADS_FILE = path.join(process.cwd(), "data", "leads.jsonl");

export type LeadSource = "newsletter" | "checkout_abandoned";

export async function saveLead(email: string, source: LeadSource) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return { ok: false as const };

  await mkdir(path.dirname(LEADS_FILE), { recursive: true });
  const line = JSON.stringify({
    email: trimmed,
    source,
    capturedAt: new Date().toISOString(),
  });
  await appendFile(LEADS_FILE, line + "\n", "utf8");
  return { ok: true as const };
}
