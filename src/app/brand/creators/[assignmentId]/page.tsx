import { ApprovePostForm, DenyPostForm } from "../../DenyPostForm";
import { postReviews, reviewedOf } from "@/lib/post-review";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/kit/ui";
import { buildTracking } from "@/components/tracking/buildTracking";
import { parseTab } from "@/components/tracking/TrackingTabs";
import { parsePostTerms, type PostRowData } from "@/lib/post-terms";

export const metadata: Metadata = { title: "Creator on a campaign" };

/**
 * One creator on one of the brand's campaigns paid per post: the same tracking view the
 * creator sees (views, posts, dollars), worded for the brand. The brand sees what it
 * owes and has paid, never our own fee. The server checks the campaign is this brand's.
 */
export default async function BrandCreatorPage(props: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const { assignmentId } = await props.params;
  const { tab, sort } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/brand/creators/${assignmentId}`);

  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved") notFound();

  // From here the service role reads, so every query is tied to this brand's own campaign.
  const db = createAdminClient();
  const { data: assignment } = await db
    .from("assignments")
    .select(
      "id, assigned_at, applicant_id, applicants(name, handle), jobs(id, title, brand_account_id, post_terms)",
    )
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment || assignment.jobs?.brand_account_id !== brand.id) notFound();
  const terms = parsePostTerms(assignment.jobs?.post_terms);
  if (!terms) notFound();

  const [{ data: postRows }, { data: payments }, { data: handleRows }] =
    await Promise.all([
      db
        .from("assignment_posts")
        .select(
          "id, platform, url, state, author_verified, views, submitted_at, window_ends_at, reject_reason, last_error",
        )
        .eq("assignment_id", assignment.id),
      // Only the amounts and whether they're paid: never our fee.
      db
        .from("direct_payments")
        .select("amount, brand_paid_at, creator_confirmed_at")
        .eq("assignment_id", assignment.id),
      db
        .from("applicant_handles")
        .select("platform, handle")
        .eq("applicant_id", assignment.applicant_id)
        .not("verified_at", "is", null),
    ]);

  const review = await postReviews((postRows ?? []).map((p) => p.id));
  const posts: PostRowData[] = (postRows ?? []).map((p) => ({
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
  const paidTotal =
    (payments ?? [])
      .filter((d) => d.brand_paid_at || d.creator_confirmed_at)
      .reduce((n, d) => n + Math.round(Number(d.amount) * 100), 0) / 100;

  const t = buildTracking({
    terms,
    posts,
    paidTotal,
    tab: parseTab(tab),
    sort: sort === "views" ? "views" : "recent",
    basePath: `/brand/creators/${assignment.id}`,
    startedAt: assignment.assigned_at,
    handles: handleRows ?? [],
    viewer: "brand",
    postAction: (post) => (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {post.reviewed === true ? (
          <span className="text-xs font-semibold text-emerald-400">Approved</span>
        ) : post.reviewed === false && terms.reviewer === "brand" ? (
          <ApprovePostForm postId={post.id} />
        ) : post.reviewed === false ? (
          <span className="text-xs text-muted-foreground">OnCamera is reviewing</span>
        ) : null}
        <DenyPostForm postId={post.id} />
      </span>
    ),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Link
          href="/brand?tab=campaigns"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Campaigns
        </Link>
        <h1 className="mt-3 font-heading text-xl font-semibold text-foreground sm:text-2xl">
          {assignment.applicants?.name ?? "Creator"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          @{assignment.applicants?.handle} · {assignment.jobs?.title}
        </p>
        {t.header}
        {t.tabs}
        {t.tab === "overview" ? t.overviewExtra : t.panel}
      </div>
    </PageShell>
  );
}
