import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePostTerms, payFor, type PostTerms } from "@/lib/post-terms";
import { postReviews, reviewedOf } from "@/lib/post-review";

/**
 * Everything a brand sees, loaded once for the signed-in brand's own campaigns:
 * campaigns, the creators on them, every post, and what has been paid. The caller has
 * already tied the brand id to the signed-in user. Money shown is what the brand owes the
 * creators: never our own fee.
 */

export type WPost = {
  id: string;
  assignmentId: string;
  campaignId: string;
  campaignTitle: string;
  creatorName: string;
  creatorHandle: string;
  applicantId: string;
  platform: string;
  url: string;
  views: number;
  state: "counting" | "final" | "rejected";
  verified: boolean;
  /** undefined when review isn't tracked yet */
  reviewed: boolean | undefined;
  submittedAt: string;
  /** When it was approved, if it has been. */
  approvedAt: string | null;
  windowEndsAt: string | null;
  repost: boolean;
  earned: number;
  /** Not rejected, and found on the creator's own account. */
  counted: boolean;
};

export type WCreator = {
  assignmentId: string;
  applicantId: string;
  campaignId: string;
  campaignTitle: string;
  name: string;
  handle: string;
  status: string;
  posts: WPost[];
  views: number;
  postsCounted: number;
  earned: number;
  /** Due now under the contract. */
  payable: number;
  /** Marked paid by the brand or confirmed by the creator. */
  paid: number;
  awaitingReview: number;
};

export type WCampaign = {
  id: string;
  title: string;
  platform: string;
  status: "open" | "filled" | "closed";
  createdAt: string;
  logoUrl: string | null;
  nicheLabel: string | null;
  terms: PostTerms | null;
  reviewer: "oncamera" | "brand" | null;
  creators: WCreator[];
  posts: WPost[];
  views: number;
  postsCounted: number;
  earned: number;
  payable: number;
  paid: number;
  awaitingReview: number;
};

export type Workspace = { campaigns: WCampaign[]; creators: WCreator[]; posts: WPost[]; reviewAvailable: boolean };

const sum = (n: number[]) => Math.round(n.reduce((a, b) => a + b, 0) * 100) / 100;

export async function loadBrandWorkspace(brandId: string): Promise<Workspace> {
  const db = createAdminClient();
  const empty: Workspace = { campaigns: [], creators: [], posts: [], reviewAvailable: false };

  const { data: jobs } = await db
    .from("jobs")
    .select("id, title, platform, status, created_at, post_terms, logo_url, niches(label)")
    .eq("brand_account_id", brandId)
    .order("created_at", { ascending: false });
  if (!jobs || jobs.length === 0) return empty;

  const { data: assignments } = await db
    .from("assignments")
    .select("id, job_id, applicant_id, status")
    .in("job_id", jobs.map((j) => j.id));
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  const applicantIds = [...new Set((assignments ?? []).map((a) => a.applicant_id))];

  const [{ data: applicants }, { data: postRows }, { data: payments }] = await Promise.all([
    applicantIds.length
      ? db.from("applicants").select("id, name, handle").in("id", applicantIds)
      : Promise.resolve({ data: [] as { id: string; name: string; handle: string }[] }),
    assignmentIds.length
      ? db
          .from("assignment_posts")
          .select("id, assignment_id, platform, url, state, author_verified, views, submitted_at, window_ends_at")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] }),
    assignmentIds.length
      ? db
          .from("direct_payments")
          .select("assignment_id, amount, brand_paid_at, creator_confirmed_at")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const review = await postReviews((postRows ?? []).map((p) => p.id));
  const person = new Map((applicants ?? []).map((a) => [a.id, a]));
  const paidBy = new Map<string, number>();
  for (const d of payments ?? []) {
    if (!d.brand_paid_at && !d.creator_confirmed_at) continue;
    paidBy.set(d.assignment_id, Math.round(((paidBy.get(d.assignment_id) ?? 0) + Number(d.amount)) * 100) / 100);
  }

  const campaigns: WCampaign[] = jobs.map((job) => {
    const terms = parsePostTerms(job.post_terms);
    const creators: WCreator[] = (assignments ?? [])
      .filter((a) => a.job_id === job.id)
      .map((a) => {
        const who = person.get(a.applicant_id);
        const rows = (postRows ?? []).filter((p) => p.assignment_id === a.id);
        const pay = terms
          ? payFor(
              terms,
              rows.map((p) => ({
                id: p.id,
                state: p.state,
                authorVerified: p.author_verified,
                views: Number(p.views),
                submittedAt: p.submitted_at,
                windowEndsAt: p.window_ends_at,
                platform: p.platform,
                reviewed: reviewedOf(review, p.id),
              })),
            )
          : null;
        const payOf = new Map((pay?.posts ?? []).map((p) => [p.id, p]));
        const posts: WPost[] = rows
          .map((p) => {
            const calc = payOf.get(p.id);
            return {
              id: p.id,
              assignmentId: a.id,
              campaignId: job.id,
              campaignTitle: job.title,
              creatorName: who?.name ?? "Creator",
              creatorHandle: who?.handle ?? "",
              applicantId: a.applicant_id,
              platform: p.platform,
              url: p.url,
              views: Number(p.views),
              state: p.state,
              verified: p.author_verified,
              reviewed: reviewedOf(review, p.id),
              submittedAt: p.submitted_at,
              approvedAt: review.approvedAt.get(p.id) ?? null,
              windowEndsAt: p.window_ends_at,
              repost: Boolean(calc?.repost),
              earned: calc ? calc.base + calc.bonus : 0,
              counted: p.state !== "rejected" && p.author_verified,
            };
          })
          .sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime());
        const counted = posts.filter((p) => p.counted);
        return {
          assignmentId: a.id,
          applicantId: a.applicant_id,
          campaignId: job.id,
          campaignTitle: job.title,
          name: who?.name ?? "Creator",
          handle: who?.handle ?? "",
          status: a.status,
          posts,
          views: counted.reduce((n, p) => n + p.views, 0),
          postsCounted: counted.length,
          earned: pay?.earned ?? 0,
          payable: pay?.payable ?? 0,
          paid: paidBy.get(a.id) ?? 0,
          awaitingReview: posts.filter((p) => p.counted && p.reviewed === false).length,
        };
      });
    const posts = creators.flatMap((c) => c.posts);
    return {
      id: job.id,
      title: job.title,
      platform: job.platform,
      status: job.status,
      createdAt: job.created_at,
      logoUrl: job.logo_url,
      nicheLabel: job.niches?.label ?? null,
      terms,
      reviewer: terms?.reviewer ?? null,
      creators,
      posts,
      views: creators.reduce((n, c) => n + c.views, 0),
      postsCounted: creators.reduce((n, c) => n + c.postsCounted, 0),
      earned: sum(creators.map((c) => c.earned)),
      payable: sum(creators.map((c) => c.payable)),
      paid: sum(creators.map((c) => c.paid)),
      awaitingReview: creators.reduce((n, c) => n + c.awaitingReview, 0),
    };
  });

  return {
    campaigns,
    creators: campaigns.flatMap((c) => c.creators),
    posts: campaigns.flatMap((c) => c.posts),
    reviewAvailable: review.available,
  };
}
