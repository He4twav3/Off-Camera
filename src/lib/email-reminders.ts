import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The record behind the automatic reminder emails: who got which reminder when, and who unsubscribed. Two small
 * JSON files in the private admin-settings bucket, so there is no database change. The unsubscribe link is signed,
 * so nobody can unsubscribe someone else.
 */
const BUCKET = "admin-settings";
const SENT = "email-reminders.json";
const UNSUBSCRIBED = "unsubscribed.json";

async function readJson<T>(file: string, empty: T): Promise<T> {
  try {
    const { data, error } = await createAdminClient().storage.from(BUCKET).download(file);
    if (error || !data) return empty;
    return JSON.parse(await data.text()) as T;
  } catch {
    return empty;
  }
}

async function writeJson(file: string, value: unknown): Promise<boolean> {
  const storage = createAdminClient().storage;
  const { data: bucket } = await storage.getBucket(BUCKET);
  if (!bucket) await storage.createBucket(BUCKET, { public: false });
  const { error } = await storage
    .from(BUCKET)
    .upload(file, new Blob([JSON.stringify(value)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (error) console.error(`email-reminders: couldn't save ${file}:`, error.message);
  return !error;
}

/** Each address, with the times it was sent a setup reminder. */
export const readReminderLog = () => readJson<Record<string, string[]>>(SENT, {});
export const saveReminderLog = (log: Record<string, string[]>) => writeJson(SENT, log);

export async function readUnsubscribed(): Promise<Set<string>> {
  return new Set(await readJson<string[]>(UNSUBSCRIBED, []));
}

export async function unsubscribe(email: string): Promise<boolean> {
  const list = await readUnsubscribed();
  list.add(email.trim().toLowerCase());
  return writeJson(UNSUBSCRIBED, [...list]);
}

function secret(): string {
  return process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "oncamera";
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function validUnsubscribe(email: string, token: string): boolean {
  const want = Buffer.from(unsubscribeToken(email));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}

export function unsubscribeUrl(baseUrl: string, email: string): string {
  return `${baseUrl}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}
