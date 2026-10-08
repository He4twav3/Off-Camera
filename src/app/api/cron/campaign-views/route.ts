import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  refreshAssignmentViews,
  refreshSignupViews,
} from "@/lib/campaign-views";
import { refreshDuePosts } from "@/lib/post-tracking";

// Daily refresh of every approved signup's view counts (see vercel.json).
// Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations; with
// no CRON_SECRET set the route refuses everything.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: signups } = await createAdminClient()
    .from("campaign_signups")
    .select("id")
    .eq("status", "approved")
    .order("last_counted_at", { ascending: true, nullsFirst: true });

  // Oldest-counted first, stop before the function times out; the rest are
  // picked up first on the next run.
  const deadline = Date.now() + 50_000;
  let done = 0;
  for (const { id } of signups ?? []) {
    if (Date.now() > deadline) break;
    await refreshSignupViews(id);
    done++;
  }

  // Then the posts creators submitted as proof on assigned campaigns — that is
  // what the brand dashboard's view counts are built from.
  const { data: proofs } = await createAdminClient()
    .from("assignments")
    .select("id")
    .not("proof_url", "is", null)
    .in("status", ["submitted", "paid"]);
  let posts = 0;
  for (const { id } of proofs ?? []) {
    if (Date.now() > deadline) break;
    await refreshAssignmentViews(id);
    posts++;
  }

  // Campaigns paid per post: every post still inside its counting window, read again.
  // A post whose window has ended is frozen here, not read.
  const perPost = await refreshDuePosts(deadline);

  return NextResponse.json({
    perPost,
    refreshed: done,
    total: signups?.length ?? 0,
    posts,
    postsTotal: proofs?.length ?? 0,
  });
}
