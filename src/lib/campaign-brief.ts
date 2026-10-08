import { postIdentity } from "@/lib/post-key";

/**
 * Turning what an admin types into the brand's brief on the campaign page: a list of
 * formats (one per line) and up to six example videos (one link per line). Pure, so the
 * admin form and the tests share it. Mirrors the limits in the database (0023).
 */

export const MAX_FORMATS = 8;
export const MAX_FORMAT_LENGTH = 160;
export const MAX_EXAMPLES = 6;

/** One entry per non-empty line, trimmed, with a cap on how many and how long. */
export function parseLines(raw: string, max = MAX_FORMATS, maxLength = MAX_FORMAT_LENGTH): { ok: true; lines: string[] } | { ok: false; error: string } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*•]+/, "").trim())
    .filter(Boolean);
  if (lines.length > max) return { ok: false, error: `Use at most ${max} lines.` };
  const long = lines.find((l) => l.length > maxLength);
  if (long) return { ok: false, error: `Keep each line under ${maxLength} characters.` };
  return { ok: true, lines };
}

/** Example videos: each line must be the full link to a post on TikTok, Instagram or YouTube. */
export function parseExampleLinks(raw: string): { ok: true; urls: string[] } | { ok: false; error: string } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > MAX_EXAMPLES) return { ok: false, error: `Add at most ${MAX_EXAMPLES} example videos.` };

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const id = postIdentity(line);
    if (!id.ok) return { ok: false, error: `"${line.slice(0, 60)}": ${id.error}` };
    // The same video twice is one example.
    if (seen.has(id.key)) continue;
    seen.add(id.key);
    urls.push(id.url);
  }
  return { ok: true, urls };
}
