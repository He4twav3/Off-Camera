import { checkPostLink, PLATFORM_NAMES, type PostPlatform } from "@/lib/post-link";

/**
 * A creator's videos: links to their own posts, kept on the profile and picked
 * from when applying. Pure helpers (no server imports) so the form and the
 * server action can share them.
 */

/** Videos a creator can keep on their profile. Mirrored in the database (0021). */
export const MAX_PROFILE_VIDEOS = 12;
/** Videos one application can carry. Mirrored in the database (0021). */
export const MAX_APPLICATION_VIDEOS = 5;

const HOSTS: { platform: PostPlatform; bases: string[] }[] = [
  { platform: "tiktok", bases: ["tiktok.com"] },
  { platform: "instagram", bases: ["instagram.com", "instagr.am"] },
  { platform: "youtube_shorts", bases: ["youtube.com", "youtu.be"] },
  { platform: "x", bases: ["x.com", "twitter.com"] },
];

/** Which platform a link belongs to, from its address. Null for anything else. */
export function detectPlatform(raw: string): PostPlatform | null {
  let host: string;
  try {
    host = new URL(raw.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  const hit = HOSTS.find((h) => h.bases.some((b) => host === b || host.endsWith(`.${b}`)));
  return hit?.platform ?? null;
}

export type VideoLinkResult =
  | { ok: true; platform: PostPlatform; url: string }
  | { ok: false; error: string };

const ALL_NAMES = ["TikTok", "Instagram", "YouTube", "X"].join(", ");

/** Checks a pasted link is a real post on a supported platform, and says which one. */
export function parseVideoLink(raw: string): VideoLinkResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Paste the link to one of your videos." };
  const platform = detectPlatform(text);
  if (!platform) {
    return {
      ok: false,
      error: `Paste a link to a post on ${ALL_NAMES}. It has to be the post itself, starting with https://`,
    };
  }
  const checked = checkPostLink(text, platform);
  if (!checked.ok) return { ok: false, error: checked.error };
  if (checked.url.length > 500) return { ok: false, error: "That link is too long." };
  return { ok: true, platform, url: checked.url };
}

export function platformName(platform: PostPlatform): string {
  return PLATFORM_NAMES[platform];
}

/** The ids picked on the apply form: unique, within the limit, in the order given. */
export function pickVideoIds(raw: string[]): { ok: true; ids: string[] } | { ok: false; error: string } {
  const ids = [...new Set(raw.map((v) => v.trim()).filter(Boolean))];
  if (ids.length === 0) return { ok: false, error: "Pick at least one of your videos to apply with." };
  if (ids.length > MAX_APPLICATION_VIDEOS) {
    return { ok: false, error: `Pick up to ${MAX_APPLICATION_VIDEOS} videos.` };
  }
  return { ok: true, ids };
}
