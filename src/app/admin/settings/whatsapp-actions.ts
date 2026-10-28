"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin-guard";
import { saveWhatsAppSettings, sendPush, sendWhatsApp } from "@/lib/whatsapp-alerts";

export interface WhatsAppState {
  error?: string;
  success?: string;
}

/** Saves the number and CallMeBot key, then sends a test message so you know it works. */
export async function saveWhatsAppAction(_prev: WhatsAppState, formData: FormData): Promise<WhatsAppState> {
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };
  if (formData.get("off") === "1") {
    await saveWhatsAppSettings(null);
    revalidatePath("/admin/settings");
    return { success: "WhatsApp alerts are off." };
  }
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "");
  const apikey = String(formData.get("apikey") ?? "").trim();
  if (!/^\+\d{7,15}$/.test(phone)) return { error: "Enter your WhatsApp number with the country code, like +447700900123." };
  if (!/^[A-Za-z0-9]{4,40}$/.test(apikey)) return { error: "Paste the key CallMeBot sent you on WhatsApp." };
  const settings = { phone, apikey };
  const sent = await sendWhatsApp("OnCamera: WhatsApp alerts are on. You'll get a message for every new signup and application.", settings);
  if (!sent) return { error: "CallMeBot didn't accept that number and key. Check both, and that you messaged its bot from this number." };
  if (!(await saveWhatsAppSettings(settings))) return { error: "The test worked, but the settings didn't save. Please try again." };
  revalidatePath("/admin/settings");
  return { success: "Saved. A test message is on its way to your WhatsApp." };
}

/** Sends a test push notification to the admin's phone. */
export async function testPushAction(_prev: WhatsAppState): Promise<WhatsAppState> {
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };
  const sent = await sendPush("OnCamera: Notifications are on. You'll get one for every new signup and application.");
  return sent ? { success: "Sent. It should pop up on your phone now." } : { error: "That didn't send. Check you subscribed to the channel name above." };
}
