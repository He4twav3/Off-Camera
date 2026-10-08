import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildTracking } from "@/components/tracking/buildTracking";
import { parseTab } from "@/components/tracking/TrackingTabs";
import { SubmitPost } from "@/components/app/SubmitPost";
import { getPaidForAssignment } from "@/lib/direct-pay-data";
import { parsePostTerms, type PostRowData } from "@/lib/post-terms";

/** One joined campaign's tracking: what it has earned, the cycle, and every post. */
// Adding a post reads it from its platform before answering, which can take a while.
export const maxDuration = 60;

export default async function CampaignEarningsPage(props: {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ tab?: string; sort?: string }>;
}) {
  const { assignmentId } = await props.params;
  const { tab, sort } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/recruiting/earnings");

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant) notFound();

  // Row-level security plus this filter: only your own assignment opens.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, assigned_at, jobs(id, title, post_terms)")
    .eq("id", assignmentId)
    .eq("applicant_id", applicant.id)
    .maybeSingle();
  const job = assignment?.jobs;
  const terms = job ? parsePostTerms(job.post_terms) : null;
  if (!assignment || !job || !terms) notFound();

  const [{ data: postRows }, { data: handles }] = await Promise.all([
    supabase
      .from("assignment_posts")
      .select(
        "id, platform, url, state, author_verified, views, submitted_at, window_ends_at, reject_reason, last_error",
      )
      .eq("assignment_id", assignment.id),
    supabase
      .from("applicant_handles")
      .select("platform, handle, verified_at")
      .eq("applicant_id", applicant.id),
  ]);
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
  }));

  const tracking = buildTracking({
    terms,
    posts,
    paidTotal: await getPaidForAssignment(assignment.id, applicant.id),
    tab: parseTab(tab),
    sort: sort === "views" ? "views" : "recent",
    basePath: `/dashboard/recruiting/earnings/${assignment.id}`,
    startedAt: assignment.assigned_at,
    handles: (handles ?? [])
      .filter((h) => h.verified_at)
      .map((h) => ({ platform: h.platform, handle: h.handle })),
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link
        href="/dashboard/recruiting/earnings"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Earnings
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {job.title}
        </h1>
        <div className="w-full sm:w-56">
          <SubmitPost assignmentId={assignment.id} />
        </div>
      </div>
      {tracking.header}
      {tracking.tabs}
      {tracking.tab === "overview" ? tracking.overviewExtra : tracking.panel}
    </div>
  );
}
