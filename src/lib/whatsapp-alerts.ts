import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * WhatsApp alerts to the admin's own phone when something new comes in: a creator signs up, a brand signs up, or a
 * creator applies to a campaign. Sent through CallMeBot (callmebot.com), a free service that messages your own
 * WhatsApp number once you have messaged its bot for a key. The number and key are saved from Admin → Account, in a
 * private storage file, so there is nothing to set up in Vercel. With no key saved, nothing is sent.
 */
const BUCKET = "admin-settings";
const FILE = "whatsapp.json";

export type WhatsAppSettings = { phone: string; apikey: string };

export async function readWhatsAppSettings(): Promise<WhatsAppSettings | null> {
  try {
    const { data, error } = await createAdminClient().storage.from(BUCKET).download(FILE);
    if (error || !data) return null;
    const parsed = JSON.parse(await data.text()) as Partial<WhatsAppSettings>;
    return parsed.phone && parsed.apikey ? { phone: parsed.phone, apikey: parsed.apikey } : null;
  } catch {
    return null;
  }
}

export async function saveWhatsAppSettings(settings: WhatsAppSettings | null): Promise<boolean> {
  const storage = createAdminClient().storage;
  const { data: bucket } = await storage.getBucket(BUCKET);
  if (!bucket) await storage.createBucket(BUCKET, { public: false });
  if (!settings) return !(await storage.from(BUCKET).remove([FILE])).error;
  const body = new Blob([JSON.stringify(settings)], { type: "application/json" });
  const { error } = await storage.from(BUCKET).upload(FILE, body, { upsert: true, contentType: "application/json" });
  return !error;
}

/** Sends one message now. True when CallMeBot accepted it. */
export async function sendWhatsApp(text: string, settings?: WhatsAppSettings | null): Promise<boolean> {
  const s = settings ?? (await readWhatsAppSettings());
  if (!s) return false;
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(s.phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(s.apikey)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    const body = await res.text();
    // CallMeBot answers 200 even for a bad key; a good send says the message was queued or sent.
    if (!res.ok || !/queued|sent/i.test(body)) {
      console.error("whatsapp-alerts: CallMeBot refused:", res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("whatsapp-alerts: couldn't send:", e instanceof Error ? e.message : e);
    return false;
  }
}

/** An alert to the admin, sent after the response so the person signing up or applying never waits on it. */
export function alertAdmin(text: string): void {
  try {
    after(() => sendWhatsApp(text));
  } catch {
    void sendWhatsApp(text);
  }
}
