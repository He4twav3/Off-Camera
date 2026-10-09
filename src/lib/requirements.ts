/**
 * The campaign requirements: read from a form, and listed for the creator's page. Pure (no server imports) so the
 * brand's forms, the creator's page and the tests share it.
 */
import type { PostTerms, Requirements } from "@/lib/post-terms";

const PERIODS = ["day", "week", "month"] as const;

/** From the form's fields. Returns undefined when the brand left it all blank, or an error for a bad number. */
export function parseRequirements(get: (name: string) => string): { ok: true; value: Requirements | undefined } | { ok: false; error: string } {
  const rawCount = get("req_count").trim();
  const length = get("req_length").trim().slice(0, 60);
  const note = get("req_note").trim();
  if (note.length > 300) return { ok: false, error: "Keep the extra requirements under 300 characters." };
  const period = (PERIODS as readonly string[]).includes(get("req_period")) ? (get("req_period") as Requirements["period"]) : "week";
  let count: number | undefined;
  if (rawCount) {
    const n = Number(rawCount);
    if (!Number.isInteger(n) || n < 1 || n > 1000) return { ok: false, error: "The number of videos must be a whole number, 1 or more." };
    count = n;
  }
  if (count === undefined && !length && !note) return { ok: true, value: undefined };
  return { ok: true, value: { count, period, length, note } };
}

const PLATFORM: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube_shorts: "YouTube Shorts", x: "X" };

/** The lines a creator reads: platforms first, then how many videos, how long, then anything else. */
export function requirementItems(terms: PostTerms): { label: string; value: string }[] {
  const r = terms.requirements;
  const items = [{ label: "Post on", value: terms.platforms.map((p) => PLATFORM[p] ?? p).join(", ") }];
  if (r?.count) items.push({ label: "How many", value: `${r.count} ${r.count === 1 ? "video" : "videos"} per ${r.period}` });
  if (r?.length) items.push({ label: "Length", value: r.length });
  if (r?.note) items.push({ label: "Also", value: r.note });
  return items;
}
