"use server";

import { normaliseHandle } from "@/lib/handles";
import type { PlatformEnum } from "@/lib/database.types";

export type CampaignState = { status?: "success" | "error"; message?: string };

const FIELDS: { name: string; platform: PlatformEnum; label: string }[] = [
  { name: "instagram_handle", platform: "instagram", label: "Instagram" },
  { name: "tiktok_handle", platform: "tiktok", label: "TikTok" },
  { name: "youtube_handle", platform: "youtube_shorts", label: "YouTube" },
];

/**
 * Campaign signup — validates the handles and forwards them to the Zapier
 * catch-hook in CAMPAIGN_WEBHOOK_URL, which creates the Creator Submissions
 * row. Server-side so the hook URL (anyone holding it can post to the Zap)
 * never reaches the browser, and so there's no CORS to deal with.
 *
 * The payload keys match what the view-tracking Zap reads
 * (instagram_handle / tiktok_handle / youtube_handle); a platform the
 * person skipped is sent as an empty string.
 */
export async function submitCampaignSignup(
  _prevState: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  // Honeypot: real people never see or fill this. Pretend success so bots
  // don't learn they were filtered.
  if (String(formData.get("website") ?? "")) {
    return { status: "success", message: "You're in. We'll be in touch." };
  }

  const payload: Record<string, string> = {};
  for (const { name, platform, label } of FIELDS) {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) {
      payload[name] = "";
      continue;
    }
    const result = normaliseHandle(raw, platform);
    if (!result.ok) {
      return { status: "error", message: `${label}: ${result.error}` };
    }
    payload[name] = result.handle;
  }

  if (!Object.values(payload).some(Boolean)) {
    return { status: "error", message: "Add at least one social handle." };
  }

  const hook = process.env.CAMPAIGN_WEBHOOK_URL;
  if (!hook) {
    console.error("CAMPAIGN_WEBHOOK_URL is not set");
    return { status: "error", message: "Signups are temporarily unavailable." };
  }

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`webhook responded ${res.status}`);
  } catch (err) {
    console.error("Campaign signup webhook failed", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return { status: "success", message: "You're in. We'll be in touch." };
}
