import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Which posts are reposts of another post (post id -> the original's id). A repost is
 * the same video on another platform: it earns no base pay (see payFor).
 *
 * Reads the repost_of column added by migration 0024. If that column isn't there yet this
 * returns an empty map, so every post counts as unique and nothing breaks.
 */
export async function repostLinks(postIds: string[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  if (postIds.length === 0) return links;
  try {
    const { data, error } = await createAdminClient()
      .from("assignment_posts")
      .select("id, repost_of" as never)
      .in("id", postIds);
    if (error || !data) return links;
    for (const row of data as unknown as { id: string; repost_of: string | null }[]) {
      if (row.repost_of) links.set(row.id, row.repost_of);
    }
  } catch {
    /* column missing: treat everything as unique */
  }
  return links;
}

/** True when the repost_of column exists, so the form may offer "this is a repost". */
export async function repostsAvailable(): Promise<boolean> {
  try {
    const { error } = await createAdminClient()
      .from("assignment_posts")
      .select("repost_of" as never)
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export type RepostChoice = { id: string; label: string };

const NAMES: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", youtube_shorts: "YouTube" };

/**
 * The creator's unique videos on this assignment, for the "is this a repost of…?" list in
 * the Add a post form. Empty when reposts aren't available yet, so the form simply doesn't
 * show the question. The caller has already checked the assignment is the creator's own.
 */
export async function repostChoices(assignmentId: string): Promise<RepostChoice[]> {
  if (!(await repostsAvailable())) return [];
  try {
    const { data } = await createAdminClient()
      .from("assignment_posts")
      .select("id, platform, url, state, submitted_at, repost_of" as never)
      .eq("assignment_id", assignmentId)
      .order("submitted_at", { ascending: true });
    return ((data ?? []) as unknown as { id: string; platform: string; url: string; state: string; submitted_at: string; repost_of: string | null }[])
      .filter((p) => p.state !== "rejected" && !p.repost_of)
      .map((p, i) => ({
        id: p.id,
        label: `Video ${i + 1}: ${NAMES[p.platform] ?? p.platform}, added ${new Date(p.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`,
      }));
  } catch {
    return [];
  }
}
