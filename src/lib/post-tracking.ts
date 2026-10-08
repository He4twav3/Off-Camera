import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleInLink, platformName, postIdentity } from "@/lib/post-key";
import { judgePost } from "@/lib/post-reading";
import { fetchPostReading } from "@/lib/post-reading-server";
import { parsePostTerms, windowEnd } from "@/lib/post-terms";

/**
 * Per-post tracking for campaigns paid per video (jobs.post_terms).
 *
 *   submitPost   a creator hands in a post: checked, stored, and read right away
 *   refreshPost  read a post again; the first reading also decides whether it counts
 *   refreshDuePosts  the daily job over every post still being counted
 *
 * The rules, in one place:
 *   - a post counts only if it is on one of the creator's OWN verified accounts and
 *     went live AFTER they joined (otherwise anyone could submit a viral video)
 *   - one post can be used once on the whole platform
 *   - views count for the contract's window after the post goes live, then FREEZE:
 *     the final number is the last reading taken inside the window, and nothing
 *     read afterwards is ever added
 *   - a failed reading never overwrites an earlier number
 */

export type SubmitPostResult =
  | { ok: true; message: string; counted: boolean }
  | { ok: false; error: string };

export async function submitPost(
  userId: string,
  assignmentId: string,
  rawUrl: string,
): Promise<SubmitPostResult> {
  const db = createAdminClient();

  const { data: assignment } = await db
    .from("assignments")
    .select("id, status, proof_url, applicants(user_id), jobs(post_terms)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment || assignment.applicants?.user_id !== userId)
    return { ok: false, error: "We couldn't find that campaign." };

  const terms = parsePostTerms(assignment.jobs?.post_terms);
  if (!terms) return { ok: false, error: "This campaign isn't paid per post." };

  const identity = postIdentity(rawUrl);
  if (!identity.ok) return { ok: false, error: identity.error };
  if (!terms.platforms.includes(identity.platform)) {
    return {
      ok: false,
      error:
        "This campaign isn't for that platform. Check which platforms it accepts.",
    };
  }

  // The post has to be on one of this creator's own VERIFIED accounts. Say so straight away
  // when it plainly isn't, instead of saving it and rejecting it later.
  const { data: applicantRow } = await db
    .from("assignments")
    .select("applicant_id")
    .eq("id", assignmentId)
    .single();
  const { data: ownHandles } = await db
    .from("applicant_handles")
    .select("handle")
    .eq("applicant_id", applicantRow?.applicant_id ?? "")
    .eq("platform", identity.platform)
    .not("verified_at", "is", null);
  const verifiedNames = (ownHandles ?? []).map((h) =>
    h.handle.trim().replace(/^@+/, "").toLowerCase(),
  );
  if (verifiedNames.length === 0) {
    return {
      ok: false,
      error: `Connect and verify your ${platformName(identity.platform)} account first. Posts only count on your own verified accounts.`,
    };
  }
  const named = handleInLink(identity.url);
  if (named && !verifiedNames.includes(named)) {
    return {
      ok: false,
      error: `That post is on @${named}, which isn't one of your verified accounts.`,
    };
  }

  const { data: used } = await db
    .from("assignment_posts")
    .select("id, assignment_id")
    .eq("post_key", identity.key)
    .neq("state", "rejected")
    .maybeSingle();
  if (used) {
    return {
      ok: false,
      error:
        used.assignment_id === assignmentId
          ? "You've already submitted that post."
          : "That post has already been submitted.",
    };
  }

  const { data: row, error } = await db
    .from("assignment_posts")
    .insert({
      assignment_id: assignmentId,
      platform: identity.platform,
      url: identity.url,
      post_key: identity.key,
    })
    .select("id")
    .single();
  if (error || !row) {
    if (error?.code === "23505")
      return { ok: false, error: "That post has already been submitted." };
    return {
      ok: false,
      error: "We couldn't save that post. Please try again.",
    };
  }

  // The first post moves the assignment on: a statement can only be issued once something is submitted.
  if (assignment.status === "active") {
    await db
      .from("assignments")
      .update({
        status: "submitted",
        proof_url: assignment.proof_url ?? identity.url,
      })
      .eq("id", assignmentId);
  }

  await refreshPost(row.id);
  const { data: after } = await db
    .from("assignment_posts")
    .select("state, author_verified, reject_reason, last_error")
    .eq("id", row.id)
    .single();

  if (after?.state === "rejected") {
    // It doesn't qualify, so it is not kept: the creator is told why and nothing is listed.
    await db.from("assignment_posts").delete().eq("id", row.id);
    // A rejected first post must not leave the campaign looking "sent in".
    if (assignment.status === "active") {
      await db
        .from("assignments")
        .update({ status: "active", proof_url: assignment.proof_url })
        .eq("id", assignmentId)
        .eq("status", "submitted");
    }
    return {
      ok: false,
      error: after.reject_reason ?? "That post can't count.",
    };
  }
  if (after?.author_verified)
    return {
      ok: true,
      counted: true,
      message: "Post added. Its views are being counted.",
    };
  return {
    ok: true,
    counted: false,
    message:
      "Post saved. We'll check it shortly and it will start counting once we've confirmed it's yours.",
  };
}

/** Reads one post again. Safe to call any time: finished or rejected posts are left alone. */
export async function refreshPost(
  postId: string,
  now: Date = new Date(),
): Promise<void> {
  const db = createAdminClient();
  const { data: post } = await db
    .from("assignment_posts")
    .select(
      "id, assignment_id, platform, url, post_key, state, author_verified, window_ends_at, views_counted_at",
    )
    .eq("id", postId)
    .maybeSingle();
  if (!post || post.state !== "counting") return;

  const { data: assignment } = await db
    .from("assignments")
    .select("assigned_at, applicant_id, jobs(post_terms)")
    .eq("id", post.assignment_id)
    .single();
  const terms = parsePostTerms(assignment?.jobs?.post_terms);
  if (!assignment || !terms) return;

  // Already verified and its window is over: freeze it as it stands. Nothing read now is added.
  if (
    post.author_verified &&
    post.window_ends_at &&
    now >= new Date(post.window_ends_at)
  ) {
    await db
      .from("assignment_posts")
      .update({ state: "final" })
      .eq("id", post.id);
    return;
  }

  const read = await fetchPostReading({
    platform: post.platform as "tiktok" | "instagram" | "youtube_shorts",
    key: post.post_key,
    url: post.url,
  });
  if (!read.ok) {
    await db
      .from("assignment_posts")
      .update({ last_error: read.error.slice(0, 300) })
      .eq("id", post.id);
    return;
  }

  if (!post.author_verified) {
    const { data: handles } = await db
      .from("applicant_handles")
      .select("handle, verified_at")
      .eq("applicant_id", assignment.applicant_id)
      .eq("platform", post.platform)
      .not("verified_at", "is", null);

    const verdict = judgePost({
      reading: read.reading,
      ownAccounts: (handles ?? []).flatMap((h) =>
        h.verified_at ? [{ handle: h.handle, verifiedAt: h.verified_at }] : [],
      ),
      joinedAt: new Date(assignment.assigned_at),
    });
    if (verdict.kind === "pending") {
      await db
        .from("assignment_posts")
        .update({ last_error: verdict.reason.slice(0, 300) })
        .eq("id", post.id);
      return;
    }
    if (verdict.kind === "rejected") {
      await db
        .from("assignment_posts")
        .update({
          state: "rejected",
          reject_reason: verdict.reason.slice(0, 300),
        })
        .eq("id", post.id);
      return;
    }

    // Verified. The window runs from when the post went live. If it has already ended there
    // is no way to know what the post had at day 30, so it can't count.
    const postedAt = new Date(read.reading.postedAt!);
    const ends = windowEnd(postedAt, terms.windowDays);
    if (now >= ends) {
      await db
        .from("assignment_posts")
        .update({
          state: "rejected",
          reject_reason: `This post is more than ${terms.windowDays} days old, so its counting window has already ended.`,
        })
        .eq("id", post.id);
      return;
    }
    await db
      .from("assignment_posts")
      .update({
        author_verified: true,
        posted_at: postedAt.toISOString(),
        window_ends_at: ends.toISOString(),
        views: read.reading.views,
        views_counted_at: now.toISOString(),
        last_error: null,
      })
      .eq("id", post.id);
    return;
  }

  await db
    .from("assignment_posts")
    .update({
      views: read.reading.views,
      views_counted_at: now.toISOString(),
      last_error: null,
    })
    .eq("id", post.id);
}

/** The daily job: every post still being counted, least recently read first, until time runs out. */
export async function refreshDuePosts(
  deadlineMs: number,
): Promise<{ done: number; total: number }> {
  const { data } = await createAdminClient()
    .from("assignment_posts")
    .select("id")
    .eq("state", "counting")
    .order("views_counted_at", { ascending: true, nullsFirst: true });
  let done = 0;
  for (const { id } of data ?? []) {
    if (Date.now() > deadlineMs) break;
    await refreshPost(id);
    done++;
  }
  return { done, total: data?.length ?? 0 };
}
