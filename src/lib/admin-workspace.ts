import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { parsePostTerms, payFor, type PostTerms } from "@/lib/post-terms";
import { postReviews, reviewedOf } from "@/lib/post-review";
import { statementState, type StatementState } from "@/lib/direct-pay";
import { providerOfLink, PAYMENT_PROVIDERS } from "@/lib/payment-links";

/**
 * Everything the admin tracks, in one load, so the overview, the campaign pages, the creator pages and
 * the payout details all show the same numbers: campaign -> creator -> posts -> statements -> payout.
 * Runs as the signed-in admin (RLS), never the service role. Includes our own fee, which only admins see.
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type AStatement = {
  id: string;
  cycle: number;
  amount: number;
  ourFee: number;
  feeReceived: boolean;
  issuedAt: string;
  dueAt: string;
  state: StatementState;
  brandMethod: string | null;
  brandReference: string | null;
  brandPaidAt: string | null;
  confirmedAt: string | null;
};

export type APost = {
  id: string;
  platform: string;
  url: string;
  views: number;
  state: "counting" | "final" | "rejected";
  verified: boolean;
  reviewed: boolean | undefined;
  submittedAt: string;
  repost: boolean;
  earned: number;
  rejectReason: string | null;
  counted: boolean;
};

export type APayout = { raw: string | null; link: string | null; provider: string | null };

export type ACreator = {
  assignmentId: string;
  applicantId: string;
  campaignId: string;
  campaignTitle: string;
  name: string;
  email: string;
  handle: string;
  payout: APayout;
  status: string;
  posts: APost[];
  statements: AStatement[];
  views: number;
  videos: number;
  earned: number;
  /** Due under the contract so far. */
  payable: number;
  /** On statements issued to the brand. */
  statemented: number;
  /** Marked paid by the brand or confirmed by the creator. */
  paid: number;
  awaitingReview: number;
};

export type ACampaign = {
  id: string;
  title: string;
  status: "open" | "filled" | "closed";
  platform: string;
  createdAt: string;
  brandId: string | null;
  brandName: string | null;
  nicheLabel: string | null;
  terms: PostTerms | null;
  perPost: boolean;
  creators: ACreator[];
  views: number;
  videos: number;
  earned: number;
  payable: number;
  statemented: number;
  paid: number;
  ourFees: number;
  feesOutstanding: number;
  awaitingReview: number;
};

export type AdminWorkspace = {
  campaigns: ACampaign[];
  creators: ACreator[];
  reviewAvailable: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;
const sum = (n: number[]) => round(n.reduce((a, b) => a + b, 0));

export function payoutOf(raw: string | null | undefined): APayout {
  const provider = providerOfLink(raw);
  return {
    raw: raw ?? null,
    link: provider ? raw!.trim() : null,
    provider: provider ? PAYMENT_PROVIDERS[provider].label : null,
  };
}

export async function loadAdminWorkspace(supabase: Supabase): Promise<AdminWorkspace> {
  const [{ data: jobs }, { data: assignments }, { data: postRows }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, platform, created_at, post_terms, brand_account_id, niches(label), brand_accounts(company_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("assignments")
      .select(
        "id, job_id, applicant_id, status, applicants(name, email, handle, payout_instructions), direct_payments(id, cycle, amount, our_fee, fee_received_at, issued_at, due_at, brand_paid_at, brand_method, brand_reference, creator_confirmed_at, creator_disputed_at)",
      ),
    supabase
      .from("assignment_posts")
      .select("id, assignment_id, platform, url, state, author_verified, views, submitted_at, window_ends_at, reject_reason"),
  ]);
  const review = await postReviews((postRows ?? []).map((p) => p.id));

  const campaigns: ACampaign[] = (jobs ?? []).map((job) => {
    const terms = parsePostTerms(job.post_terms);
    const creators: ACreator[] = (assignments ?? [])
      .filter((a) => a.job_id === job.id)
      .map((a) => {
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
        const calc = new Map((pay?.posts ?? []).map((p) => [p.id, p]));
        const posts: APost[] = rows
          .map((p) => {
            const c = calc.get(p.id);
            return {
              id: p.id,
              platform: p.platform,
              url: p.url,
              views: Number(p.views),
              state: p.state,
              verified: p.author_verified,
              reviewed: reviewedOf(review, p.id),
              submittedAt: p.submitted_at,
              repost: Boolean(c?.repost),
              earned: c ? c.base + c.bonus : 0,
              rejectReason: p.reject_reason,
              counted: p.state !== "rejected" && p.author_verified,
            };
          })
          .sort((x, y) => new Date(y.submittedAt).getTime() - new Date(x.submittedAt).getTime());
        const statements: AStatement[] = (a.direct_payments ?? [])
          .map((d) => ({
            id: d.id,
            cycle: d.cycle,
            amount: Number(d.amount),
            ourFee: Number(d.our_fee),
            feeReceived: Boolean(d.fee_received_at),
            issuedAt: d.issued_at,
            dueAt: d.due_at,
            state: statementState(d),
            brandMethod: d.brand_method,
            brandReference: d.brand_reference,
            brandPaidAt: d.brand_paid_at,
            confirmedAt: d.creator_confirmed_at,
          }))
          .sort((x, y) => x.cycle - y.cycle);
        const counted = posts.filter((p) => p.counted);
        return {
          assignmentId: a.id,
          applicantId: a.applicant_id,
          campaignId: job.id,
          campaignTitle: job.title,
          name: a.applicants?.name ?? "Creator",
          email: a.applicants?.email ?? "",
          handle: a.applicants?.handle ?? "",
          payout: payoutOf(a.applicants?.payout_instructions),
          status: a.status,
          posts,
          statements,
          views: counted.reduce((n, p) => n + p.views, 0),
          videos: counted.length,
          earned: pay?.earned ?? 0,
          payable: pay?.payable ?? 0,
          statemented: sum(statements.map((s) => s.amount)),
          paid: sum(statements.filter((s) => s.brandPaidAt || s.confirmedAt).map((s) => s.amount)),
          awaitingReview: posts.filter((p) => p.counted && p.reviewed === false).length,
        };
      });
    const all = creators.flatMap((c) => c.statements);
    return {
      id: job.id,
      title: job.title,
      status: job.status,
      platform: job.platform,
      createdAt: job.created_at,
      brandId: job.brand_account_id,
      brandName: job.brand_accounts?.company_name ?? null,
      nicheLabel: job.niches?.label ?? null,
      terms,
      perPost: Boolean(terms),
      creators,
      views: creators.reduce((n, c) => n + c.views, 0),
      videos: creators.reduce((n, c) => n + c.videos, 0),
      earned: sum(creators.map((c) => c.earned)),
      payable: sum(creators.map((c) => c.payable)),
      statemented: sum(creators.map((c) => c.statemented)),
      paid: sum(creators.map((c) => c.paid)),
      ourFees: sum(all.map((s) => s.ourFee)),
      feesOutstanding: sum(all.filter((s) => !s.feeReceived).map((s) => s.ourFee)),
      awaitingReview: creators.reduce((n, c) => n + c.awaitingReview, 0),
    };
  });

  return { campaigns, creators: campaigns.flatMap((c) => c.creators), reviewAvailable: review.available };
}
