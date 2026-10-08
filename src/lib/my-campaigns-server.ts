import "server-only";
import { repostLinks } from "@/lib/post-reposts";
import type { createClient } from "@/lib/supabase/server";
import { getPaidByAssignment } from "@/lib/direct-pay-data";
import {
  myCampaignRow,
  sortMyCampaigns,
  type MyCampaignRow,
} from "@/lib/my-campaigns";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The campaigns a creator has joined, each with its tracking in short, for the Earnings
 * page. Row-level security means they read only their own assignments and posts; what
 * they have confirmed receiving comes from their own statements.
 */
export async function loadMyCampaigns(
  supabase: Supabase,
  applicantId: string,
): Promise<MyCampaignRow[]> {
  const { data: joined } = await supabase
    .from("assignments")
    .select(
      "id, status, applicant_payout_amount, jobs(id, title, logo_url, platform, post_terms), assignment_posts(id, state, author_verified, views, submitted_at, window_ends_at)",
    )
    .eq("applicant_id", applicantId);

  const links = await repostLinks(
    (joined ?? []).flatMap((a) => a.assignment_posts.map((p) => p.id)),
  );

  const paid = await getPaidByAssignment(
    (joined ?? []).map((a) => a.id),
    applicantId,
  );

  return sortMyCampaigns(
    (joined ?? []).flatMap((a) =>
      a.jobs
        ? [
            myCampaignRow({
              assignmentId: a.id,
              status: a.status,
              expectedAmount: Number(a.applicant_payout_amount),
              job: a.jobs,
              posts: a.assignment_posts.map((p) => ({
                id: p.id,
                state: p.state,
                authorVerified: p.author_verified,
                views: Number(p.views),
                submittedAt: p.submitted_at,
                windowEndsAt: p.window_ends_at,
                repostOf: links.get(p.id) ?? null,
              })),
              paidTotal: paid.get(a.id) ?? 0,
            }),
          ]
        : [],
    ),
  );
}
