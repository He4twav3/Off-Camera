import type { Metadata } from "next";
import { postReviews, reviewedOf } from "@/lib/post-review";
import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { parsePostTerms, payFor, suggestedStatement } from "@/lib/post-terms";
import { statementState } from "@/lib/direct-pay";
import { StatementsView, type StatementRowData } from "./StatementsView";
import { getFeeBands } from "@/lib/campaign-fees";

export const metadata: Metadata = { title: "Statements · Admin" };

const norm = (v: string) => v.trim().replace(/^@+/, "").toLowerCase();

export default async function AdminStatementsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await props.searchParams;
  await requireAdminMfa("/admin/statements");
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      "id, job_id, status, proof_url, assigned_at, applicants(name, email, handle), jobs(title, payout_terms, post_terms, brand_account_id, brand_accounts(company_name)), assignment_posts(id, platform, url, state, author_verified, views, submitted_at, window_ends_at, reject_reason, last_error), direct_payments(id, cycle, amount, issued_at, due_at, brand_paid_at, brand_method, brand_reference, creator_confirmed_at, creator_disputed_at, creator_dispute_note, our_fee, fee_received_at)",
    )
    .order("assigned_at", { ascending: false });

  const { data: viewRows } = await supabase
    .from("campaign_views")
    .select("campaign, handle, views");
  const viewsByKey = new Map<string, number>();
  for (const r of viewRows ?? []) {
    const key = `${norm(r.campaign)}|${norm(r.handle)}`;
    viewsByKey.set(key, (viewsByKey.get(key) ?? 0) + Number(r.views));
  }

  // The fee set for each campaign, and how much creator pay each campaign has already been billed: the fee on a new
  // statement is worked out from both, so it is filled in rather than typed.
  const fees = await getFeeBands([...new Set((assignments ?? []).map((a) => a.job_id))]);
  const billedBefore = new Map<string, number>();
  const monthBilled = new Map<string, number>();
  const monthFees = new Map<string, number>();
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  for (const a of assignments ?? []) {
    for (const d of a.direct_payments) {
      billedBefore.set(a.job_id, (billedBefore.get(a.job_id) ?? 0) + Number(d.amount));
      if (d.issued_at >= monthStart) {
        monthBilled.set(a.job_id, (monthBilled.get(a.job_id) ?? 0) + Number(d.amount));
        monthFees.set(a.job_id, (monthFees.get(a.job_id) ?? 0) + Number(d.our_fee));
      }
    }
  }

  const review = await postReviews((assignments ?? []).flatMap((a) => a.assignment_posts.map((p) => p.id)));

  // One row per statement. An assignment with none yet is one row waiting for its first.
  const rows: StatementRowData[] = (assignments ?? []).flatMap(
    (a): StatementRowData[] => {
      const terms = parsePayoutTerms(a.jobs?.payout_terms);
      const views =
        a.jobs && a.applicants
          ? (viewsByKey.get(
              `${norm(a.jobs.title)}|${norm(a.applicants.handle)}`,
            ) ?? 0)
          : 0;
      const base = {
        id: a.id,
        status: a.status,
        views,
        proof_url: a.proof_url,
        suggested: terms ? calculatePayout(terms, views).total : null,
        applicants: a.applicants,
        jobs: a.jobs
          ? { title: a.jobs.title, brand_accounts: a.jobs.brand_accounts }
          : null,
      };
      // A campaign paid per post: what the contract says is due, worked out post by post,
      // less what earlier statements already cover. One more ready row appears whenever
      // there is something new to put on a statement.
      const postTerms = parsePostTerms(a.jobs?.post_terms);
      if (postTerms) {
        const posts = a.assignment_posts.map((p) => ({
          id: p.id,
          platform: p.platform,
          url: p.url,
          state: p.state,
          authorVerified: p.author_verified,
          views: Number(p.views),
          submittedAt: p.submitted_at,
          windowEndsAt: p.window_ends_at,
          rejectReason: p.reject_reason,
          lastError: p.last_error,
          reviewed: reviewedOf(review, p.id),
        }));
        const pay = payFor(postTerms, posts);
        const statemented = a.direct_payments.reduce(
          (n, d) => n + Number(d.amount),
          0,
        );
        const due = suggestedStatement(pay, statemented);
        const perPost = {
          earned: pay.earned,
          payable: pay.payable,
          statemented,
          nextCycle: Math.max(0, ...a.direct_payments.map((d) => d.cycle)) + 1,
          counted: pay.counted,
          posts,
        };
        const counted = posts.filter(
          (p) => p.state !== "rejected" && p.authorVerified,
        );
        const perPostBase = {
          ...base,
          views: counted.reduce((n, p) => n + p.views, 0),
          perPost,
        };
        const issued = a.direct_payments.map((dp) => ({
          ...perPostBase,
          suggested: null,
          direct_payments: dp,
          state: statementState(dp),
        }));
        const ready =
          due > 0 && a.status === "submitted"
            ? [
                {
                  ...perPostBase,
                  suggested: due,
                  direct_payments: null,
                  state: null,
                  fee: {
                    terms: fees.terms.get(a.job_id) ?? { bands: [], minimum: 0 },
                    lifetimeBilled: billedBefore.get(a.job_id) ?? 0,
                    monthBilled: monthBilled.get(a.job_id) ?? 0,
                    monthFees: monthFees.get(a.job_id) ?? 0,
                  },
                },
              ]
            : [];
        // A creator with posts to check but nothing due yet still shows up, so posts needing a decision aren't missed.
        const needsLook = posts.some(
          (p) => p.state === "counting" && !p.authorVerified,
        );
        if (ready.length === 0 && issued.length === 0 && needsLook) {
          return [
            {
              ...perPostBase,
              suggested: 0,
              direct_payments: null,
              state: null,
            },
          ];
        }
        return [...ready, ...issued];
      }

      if (a.direct_payments.length === 0)
        return [{ ...base, direct_payments: null, state: null }];
      return a.direct_payments.map((dp) => ({
        ...base,
        direct_payments: dp,
        state: statementState(dp),
      }));
    },
  );

  return <StatementsView rows={rows} tab={tab} />;
}
