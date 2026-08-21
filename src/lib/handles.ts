import type { PlatformEnum } from "@/lib/database.types";

// Handle validation and normalisation.
//
// What this DOES do: strips the @, accepts a pasted profile URL and pulls the
// handle out of it, and enforces each platform's actual username rules.
//
// What this does NOT do: prove the person owns the account. There's no honest
// way to do that without platform API access — so `applicant_handles` has a
// `verified_at` column an admin sets after clicking through and eyeballing it.
// Follower counts are self-reported for the same reason. Treat both as claims
// until checked.

interface PlatformRule {
  label: string;
  /** Max length of the handle itself, excluding the @. */
  maxLength: number;
  /** Characters permitted in a valid handle. */
  pattern: RegExp;
  /** Human-readable rule, shown as a hint and in errors. */
  rule: string;
  /** Hosts whose URLs we'll accept and extract a handle from. */
  hosts: string[];
  /** Builds the public profile URL from a bare handle. */
  profileUrl: (handle: string) => string;
}

export const PLATFORM_RULES: Record<PlatformEnum, PlatformRule> = {
  tiktok: {
    label: "TikTok",
    maxLength: 24,
    pattern: /^[a-zA-Z0-9._]+$/,
    rule: "Letters, numbers, underscores and full stops.",
    hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
    profileUrl: (h) => `https://www.tiktok.com/@${h}`,
  },
  instagram: {
    label: "Instagram",
    maxLength: 30,
    pattern: /^[a-zA-Z0-9._]+$/,
    rule: "Letters, numbers, underscores and full stops.",
    hosts: ["instagram.com", "www.instagram.com"],
    profileUrl: (h) => `https://www.instagram.com/${h}`,
  },
  youtube_shorts: {
    label: "YouTube Shorts",
    maxLength: 30,
    pattern: /^[a-zA-Z0-9._-]+$/,
    rule: "Letters, numbers, underscores, full stops and hyphens.",
    hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    profileUrl: (h) => `https://www.youtube.com/@${h}`,
  },
  x: {
    label: "X",
    maxLength: 15,
    pattern: /^[a-zA-Z0-9_]+$/,
    rule: "Letters, numbers and underscores only, up to 15 characters.",
    hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
    profileUrl: (h) => `https://x.com/${h}`,
  },
};

export interface HandleResult {
  ok: boolean;
  /** Cleaned handle, no @ and no URL wrapper. */
  handle: string;
  /** Canonical profile URL, only set when ok. */
  profileUrl?: string;
  error?: string;
}

/**
 * Normalises whatever the creator typed into a bare handle, then validates it.
 * Accepts "@name", "name", and full profile URLs including ones with query
 * strings or trailing slashes.
 */
export function normaliseHandle(
  raw: string,
  platform: PlatformEnum,
): HandleResult {
  const rule = PLATFORM_RULES[platform];
  let value = raw.trim();

  if (!value) {
    return { ok: false, handle: "", error: "Enter your handle." };
  }

  // Pasted a URL? Pull the handle out of the path.
  if (/^https?:\/\//i.test(value) || /^[\w.-]+\.(com|be)\//i.test(value)) {
    const extracted = extractFromUrl(value, platform);
    if (!extracted) {
      return {
        ok: false,
        handle: "",
        error: `That doesn't look like a ${rule.label} profile link.`,
      };
    }
    value = extracted;
  }

  // Strip a leading @, and any stray whitespace inside.
  value = value.replace(/^@+/, "").replace(/\s+/g, "");

  if (!value) {
    return { ok: false, handle: "", error: "Enter your handle." };
  }
  if (value.length > rule.maxLength) {
    return {
      ok: false,
      handle: value,
      error: `${rule.label} handles are at most ${rule.maxLength} characters.`,
    };
  }
  if (!rule.pattern.test(value)) {
    return {
      ok: false,
      handle: value,
      error: `That handle has characters ${rule.label} doesn't allow. ${rule.rule}`,
    };
  }

  return { ok: true, handle: value, profileUrl: rule.profileUrl(value) };
}

function extractFromUrl(input: string, platform: PlatformEnum): string | null {
  const rule = PLATFORM_RULES[platform];
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (!rule.hosts.includes(host)) return null;

  // First non-empty path segment, minus any @ prefix.
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const first = decodeURIComponent(segments[0]).replace(/^@+/, "");

  // YouTube uses /channel/, /c/ and /user/ prefixes before the actual name.
  if (
    platform === "youtube_shorts" &&
    ["channel", "c", "user"].includes(first.toLowerCase()) &&
    segments[1]
  ) {
    return decodeURIComponent(segments[1]).replace(/^@+/, "");
  }

  return first || null;
}

/** Compact display, e.g. "12.4k". Follower counts are self-reported. */
export function formatFollowers(count: number | null): string | null {
  if (count === null) return null;
  if (count < 1000) return String(count);
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
  }
  const m = count / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}m`;
}

/** Age from a date of birth, for the profile card. */
export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

export const EDUCATION_LEVELS = [
  "Still at school",
  "High school",
  "Some college",
  "Undergraduate degree",
  "Postgraduate degree",
  "Self-taught",
  "Prefer not to say",
] as const;

export const CONTENT_TYPES = [
  "Talking head",
  "Voiceover",
  "Unboxing",
  "Tutorial / how-to",
  "Skit / comedy",
  "Vlog",
  "Product demo",
  "Green screen",
  "Street interview",
] as const;
