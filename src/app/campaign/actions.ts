"use server";

import { normaliseHandle } from "@/lib/handles";
import type { PlatformEnum } from "@/lib/database.types";

export type CampaignState = { status?: "success" | "error"; message?: string };

const FIELDS: { name: string; platform: PlatformEnum; label: string }[] = [
  { name: "instagram_handle", platform: "instagram", label: "Instagram" },
  { name: "tiktok_handle", platform: "tiktok", label: "TikTok" },
  { name: "youtube_handle", platform: "youtube_shorts", label: "YouTube" },
];

const POST_HOSTS = [
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
];
const MAX_POST_LINKS = 10;

/** One URL per line (or space-separated); https only, known platforms only. */
function parsePostLinks(raw: string): { links: string[] } | { error: string } {
  const parts = raw.split(/[\s,]+/).filter(Boolean);
  if (parts.length > MAX_POST_LINKS) {
    return { error: `Add at most ${MAX_POST_LINKS} post links.` };
  }
  const links: string[] = [];
  for (const part of parts) {
    let url: URL;
    try {
      url = new URL(part);
    } catch {
      return { error: `"${part.slice(0, 40)}" isn't a valid link.` };
    }
    const host = url.hostname.toLowerCase().replace(/^(www|m|vm|vt)\./, "");
    if (url.protocol !== "https:" || !POST_HOSTS.includes(host)) {
      return { error: "Post links must be Instagram, TikTok or YouTube URLs." };
    }
    links.push(url.toString());
  }
  return { links };
}

/**
 * Campaign signup — validates the handles and forwards them to the Zapier
 * catch-hook in CAMPAIGN_WEBHOOK_URL, which creates the Creator Submissions
 * row. Server-side so the hook URL (anyone holding it can post to the Zap)
 * never reaches the browser, and so there's no CORS to deal with.
 *
 * Payload: creator_name, campaign (from /campaign?c=..., may be empty),
 * post_links (newline-separated URLs of the campaign posts, may be empty) and
 * the keys the view-tracking Zap reads (instagram_handle / tiktok_handle /
 * youtube_handle); a platform the person skipped is sent as an empty string.
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

  const creatorName = String(formData.get("creator_name") ?? "").trim().slice(0, 100);
  if (!creatorName) {
    return { status: "error", message: "Enter your name." };
  }

  const payload: Record<string, string> = {
    creator_name: creatorName,
    campaign: String(formData.get("campaign") ?? "").trim().slice(0, 100),
  };
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

  const postLinks = parsePostLinks(String(formData.get("post_links") ?? ""));
  if ("error" in postLinks) {
    return { status: "error", message: postLinks.error };
  }
  payload.post_links = postLinks.links.join("\n");

  if (!FIELDS.some(({ name }) => payload[name])) {
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
