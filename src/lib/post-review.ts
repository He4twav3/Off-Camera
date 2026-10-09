import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Which posts have been approved by their reviewer (OnCamera or the brand). Reads the
 * reviewed_at column added by migration 0024. If that column isn't there yet, review isn't
 * tracked: `available` is false and every post is treated as approved, so nothing breaks.
 */
export type ReviewInfo = { available: boolean; approved: Set<string>; approvedAt: Map<string, string> };

export async function postReviews(postIds: string[]): Promise<ReviewInfo> {
  const none: ReviewInfo = { available: false, approved: new Set(), approvedAt: new Map() };
  try {
    const db = createAdminClient();
    const probe = await db.from("assignment_posts").select("reviewed_at" as never).limit(1);
    if (probe.error) return none;
    const approved = new Set<string>();
    const approvedAt = new Map<string, string>();
    if (postIds.length > 0) {
      const { data, error } = await db
        .from("assignment_posts")
        .select("id, reviewed_at" as never)
        .in("id", postIds);
      if (error) return none;
      for (const row of (data ?? []) as unknown as { id: string; reviewed_at: string | null }[]) {
        if (row.reviewed_at) {
          approved.add(row.id);
          approvedAt.set(row.id, row.reviewed_at);
        }
      }
    }
    return { available: true, approved, approvedAt };
  } catch {
    return none;
  }
}

/** true / false when review is tracked, undefined when it isn't. */
export function reviewedOf(info: ReviewInfo, postId: string): boolean | undefined {
  return info.available ? info.approved.has(postId) : undefined;
}
