import "server-only";
import { repostLinks } from "@/lib/post-reposts";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, PlatformEnum } from "@/lib/database.types";
import { parsePostTerms, payFor } from "@/lib/post-terms";

/**
 * What a brand is allowed to see about its own campaigns: creator name and
 * handle, where they are on the campaign, the link to their post, and views.
 * Deliberately NOT creator emails, payouts or anything else on `applicants` /
 * `assignments` — this reads with the service role, so it selects columns
 * explicitly and only ever for jobs whose brand_account_id is the caller's.
 * Callers must pass a brand id they have already tied to the signed-in user.
 */

type PostRow = Pick<
  Database["public"]["Tables"]["assignment_posts"]["Row"],
  | "id"
  | "assignment_id"
  | "state"
  | "author_verified"
  | "views"
  | "submitted_at"
  | "window_ends_at"
>;

export type BrandCreator = {
  assignmentId: string;
  name: string;
  handle: string;
  platform: PlatformEnum;
  status: "active" | "submitted" | "paid" | "disputed";
  proofUrl: string | null;
  views: number;
  /**
   * For a campaign paid per post: what this creator has earned so far under the contract,
   * and how much of it is due now. The same numbers the creator sees (lib/post-terms.ts).
   * What the brand owes the creator, never our own fee.
   */
  pay: { earned: number; payable: number; posts: number } | null;
};

export type BrandCampaign = {
  id: string;
  title: string;
  platform: PlatformEnum;
  status: "open" | "filled" | "closed";
  createdAt: string;
  logoUrl: string | null;
  creators: BrandCreator[];
  totalViews: number;
};

export async function getBrandCampaigns(
  brandId: string,
): Promise<BrandCampaign[]> {
  const db = createAdminClient();

  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, platform, status, created_at, post_terms, logo_url")
    .eq("brand_account_id", brandId)
    .order("created_at", { ascending: false });
  if (!jobs || jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const { data: assignments } = await db
    .from("assignments")
    .select("id, job_id, applicant_id, status, proof_url")
    .in("job_id", jobIds);

  // Posts tracked one by one, for campaigns paid per post.
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const { data: postRows } = assignmentIds.length
    ? await db
        .from("assignment_posts")
        .select(
          "id, assignment_id, state, author_verified, views, submitted_at, window_ends_at",
        )
        .in("assignment_id", assignmentIds)
    : { data: [] };
  const links = await repostLinks((postRows ?? []).map((p) => p.id));
  const postsByAssignment = new Map<string, PostRow[]>();
  for (const p of postRows ?? []) {
    const list = postsByAssignment.get(p.assignment_id) ?? [];
    list.push(p);
    postsByAssignment.set(p.assignment_id, list);
  }

  const applicantIds = [
    ...new Set((assignments ?? []).map((a) => a.applicant_id)),
  ];
  const [{ data: applicants }, { data: handles }, { data: views }] =
    await Promise.all([
      applicantIds.length
        ? db
            .from("applicants")
            .select("id, name, handle, platform")
            .in("id", applicantIds)
        : Promise.resolve({ data: [] }),
      applicantIds.length
        ? db
            .from("applicant_handles")
            .select("applicant_id, handle")
            .in("applicant_id", applicantIds)
        : Promise.resolve({ data: [] }),
      db
        .from("campaign_views")
        .select("campaign, handle, views")
        .in(
          "campaign",
          jobs.map((j) => j.title),
        ),
    ]);

  const applicantById = new Map((applicants ?? []).map((a) => [a.id, a]));
  const handlesByApplicant = new Map<string, string[]>();
  for (const h of handles ?? []) {
    const list = handlesByApplicant.get(h.applicant_id) ?? [];
    list.push(h.handle.toLowerCase());
    handlesByApplicant.set(h.applicant_id, list);
  }

  return jobs.map((job) => {
    const creators: BrandCreator[] = (assignments ?? [])
      .filter((a) => a.job_id === job.id)
      .map((a) => {
        const person = applicantById.get(a.applicant_id);
        const own = new Set([
          ...(handlesByApplicant.get(a.applicant_id) ?? []),
          (person?.handle ?? "").toLowerCase(),
        ]);
        // A campaign paid per post counts each post on its own; any other campaign counts
        // the creator's views by campaign title and handle, as before.
        const postTerms = parsePostTerms(job.post_terms);
        const posts = postsByAssignment.get(a.id) ?? [];
        const counted = posts.filter(
          (p) => p.state !== "rejected" && p.author_verified,
        );
        const pay = postTerms
          ? payFor(
              postTerms,
              posts.map((p) => ({
                id: p.id,
                state: p.state,
                authorVerified: p.author_verified,
                views: Number(p.views),
                submittedAt: p.submitted_at,
                windowEndsAt: p.window_ends_at,
                repostOf: links.get(p.id) ?? null,
              })),
            )
          : null;
        const creatorViews = postTerms
          ? counted.reduce((n, p) => n + Number(p.views), 0)
          : (views ?? [])
              .filter((v) => v.campaign === job.title && own.has(v.handle))
              .reduce((n, v) => n + v.views, 0);
        return {
          assignmentId: a.id,
          name: person?.name ?? "Creator",
          handle: person?.handle ?? "",
          platform: (person?.platform ?? job.platform) as PlatformEnum,
          status: a.status,
          proofUrl: a.proof_url,
          views: creatorViews,
          pay: pay
            ? { earned: pay.earned, payable: pay.payable, posts: pay.counted }
            : null,
        };
      });
    return {
      id: job.id,
      title: job.title,
      platform: job.platform,
      status: job.status,
      createdAt: job.created_at,
      logoUrl: job.logo_url,
      creators,
      totalViews: creators.reduce((n, c) => n + c.views, 0),
    };
  });
}
