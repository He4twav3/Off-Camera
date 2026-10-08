import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmissionsView } from "@/components/app/SubmissionsView";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { parsePostTerms, payFor } from "@/lib/post-terms";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";

export const metadata: Metadata = { title: "Submissions" };

// Add in cents so amounts like 0.1 + 0.2 stay exact.
const sumMoney = (values: number[]) =>
  values.reduce((c, v) => c + Math.round(v * 100), 0) / 100;

export default async function SubmissionsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruiting/submissions");

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  // Assignments join to jobs, never to payouts: what a brand paid us is admin-only.
  const [{ data: assignments }, { data: viewRows }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, status, proof_url, applicant_payout_amount, assigned_at, paid_at, jobs(id, title, platform, payout_terms, post_terms), assignment_posts(id, state, author_verified, views, submitted_at, window_ends_at)",
      )
      .eq("applicant_id", applicant.id)
      .order("assigned_at", { ascending: false }),
    // RLS limits this to views on the creator's own handles.
    supabase.from("campaign_views").select("campaign, views"),
  ]);

  const viewsByCampaign = new Map<string, number>();
  for (const v of viewRows ?? []) {
    viewsByCampaign.set(
      v.campaign,
      (viewsByCampaign.get(v.campaign) ?? 0) + Number(v.views),
    );
  }

  const rows = (assignments ?? []).map((a) => {
    // A campaign paid per post: views and dollars come from its posts, counted one by one.
    const postTerms = parsePostTerms(a.jobs?.post_terms);
    if (postTerms) {
      const pay = payFor(
        postTerms,
        a.assignment_posts.map((p) => ({
          id: p.id,
          state: p.state,
          authorVerified: p.author_verified,
          views: Number(p.views),
          submittedAt: p.submitted_at,
          windowEndsAt: p.window_ends_at,
        })),
      );
      const counted = a.assignment_posts.filter(
        (p) => p.state !== "rejected" && p.author_verified,
      );
      const sent = a.assignment_posts.filter((p) => p.state !== "rejected");
      return {
        a,
        terms: null,
        views: counted.reduce((n, p) => n + Number(p.views), 0),
        amount: pay.earned,
        estimated: true,
        posts: {
          sent: sent.length,
          counting: counted.length,
          rejected: a.assignment_posts.length - sent.length,
          href: `/dashboard/recruiting/earnings/${a.id}?tab=posts`,
        },
      };
    }
    const terms = parsePayoutTerms(a.jobs?.payout_terms);
    const views = a.jobs ? (viewsByCampaign.get(a.jobs.title) ?? 0) : 0;
    // What the formula gives at today's views, less our commission if one is set.
    // Once paid, the amount actually paid replaces the estimate.
    const formula = terms ? calculatePayout(terms, views).total : null;
    const estimate =
      formula === null
        ? Number(a.applicant_payout_amount)
        : Math.round(
            formula * (1 - (PLATFORM_COMMISSION_PERCENT ?? 0) / 100) * 100,
          ) / 100;
    const amount =
      a.status === "paid" ? Number(a.applicant_payout_amount) : estimate;
    return {
      a,
      terms,
      views,
      amount,
      estimated: a.status !== "paid" && formula !== null,
      posts: null,
    };
  });

  // Posts that were sent and not rejected. A rejected post is not a post sent.
  const submitted = rows.reduce(
    (n, r) => n + (r.posts ? r.posts.sent : r.a.proof_url ? 1 : 0),
    0,
  );
  const totalViews = rows.reduce((n, r) => n + r.views, 0);
  const pending = sumMoney(
    rows.filter((r) => r.a.status !== "paid").map((r) => r.amount),
  );
  const paid = sumMoney(
    rows.filter((r) => r.a.status === "paid").map((r) => r.amount),
  );

  return (
    <SubmissionsView
      status={status}
      totals={{ submitted, views: totalViews, expected: pending, paid }}
      rows={rows.map(({ a, terms, views, amount, estimated, posts }) => ({
        id: a.id,
        jobId: a.jobs?.id ?? null,
        // Only rejected posts so far means nothing is in review.
        status:
          posts && posts.sent === 0 && a.status === "submitted"
            ? "active"
            : a.status,
        posts,
        title: a.jobs?.title ?? "Campaign",
        platform: a.jobs?.platform ?? null,
        assignedAt: a.assigned_at,
        paidAt: a.paid_at,
        proofUrl: a.proof_url,
        terms,
        views,
        amount,
        estimated,
      }))}
    />
  );
}
