import "server-only";
import { createHmac } from "node:crypto";
import type { PlatformEnum } from "@/lib/database.types";

/**
 * Proving a creator owns a handle: they put a short code in that account's bio
 * (or channel description) and we look for it there.
 *
 * The code is derived — HMAC(server secret, applicant|platform|handle) — so it
 * needs no table, is the same every time it's shown, and changes if the handle
 * does. Bios are read from YouTube's API (YOUTUBE_API_KEY) and, for TikTok and
 * Instagram, via Apify (APIFY_TOKEN). Those are scraping/third-party calls that
 * can fail; when they do the creator is told, and an admin can still verify by
 * hand from /admin.
 */

export function verificationCode(applicantId: string, platform: PlatformEnum, handle: string) {
  const key = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only")
    .update("handle-verification-v1")
    .digest();
  const mac = createHmac("sha256", key)
    .update(`${applicantId}|${platform}|${handle.toLowerCase()}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `oncamera-${mac}`;
}

export type BioResult =
  | { ok: true; bio: string }
  | { ok: false; reason: "unsupported" | "unavailable" | "not-found"; message: string };

async function apify(actor: string, payload: unknown) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(50_000),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const UNAVAILABLE: BioResult = {
  ok: false,
  reason: "unavailable",
  message: "Automatic checking isn't available right now. We'll verify this account by hand.",
};

/** Fetches the public bio / description for a handle. */
export async function fetchBio(platform: PlatformEnum, handle: string): Promise<BioResult> {
  const h = handle.replace(/^@+/, "");
  try {
    if (platform === "youtube_shorts") {
      if (!process.env.YOUTUBE_API_KEY) return UNAVAILABLE;
      const qs = new URLSearchParams({ part: "snippet", forHandle: `@${h}`, key: process.env.YOUTUBE_API_KEY });
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs}`, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return UNAVAILABLE;
      const item = (await res.json()).items?.[0];
      return item
        ? { ok: true, bio: String(item.snippet?.description ?? "") }
        : { ok: false, reason: "not-found", message: "We couldn't find that YouTube channel." };
    }

    if (!process.env.APIFY_TOKEN) return UNAVAILABLE;

    if (platform === "instagram") {
      const items = await apify("apify~instagram-profile-scraper", { usernames: [h] });
      return items[0]
        ? { ok: true, bio: String(items[0].biography ?? "") }
        : { ok: false, reason: "not-found", message: "We couldn't find that Instagram account." };
    }

    if (platform === "tiktok") {
      const items = await apify("clockworks~tiktok-scraper", { profiles: [h], resultsPerPage: 1 });
      const bio = items[0]?.authorMeta?.signature;
      return typeof bio === "string"
        ? { ok: true, bio }
        : { ok: false, reason: "not-found", message: "We couldn't read that TikTok profile." };
    }

    return {
      ok: false,
      reason: "unsupported",
      message: "We can't check this platform automatically yet. We'll verify it by hand.",
    };
  } catch (err) {
    console.error("fetchBio failed:", platform, (err as Error).message);
    return UNAVAILABLE;
  }
}
