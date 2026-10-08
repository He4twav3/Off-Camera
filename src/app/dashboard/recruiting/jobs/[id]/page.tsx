import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/ProfileCard";
import { ApplyForm } from "./ApplyForm";
import { CampaignView } from "@/components/app/CampaignView";
import { SubmitContent } from "./SubmitContent";
import { SubmitPost } from "@/components/app/SubmitPost";
import { repostChoices } from "@/lib/post-reposts";
import { parsePostTerms } from "@/lib/post-terms";
import type { VideoItem } from "@/components/app/VideosCard";
import { parsePayoutTerms } from "@/lib/payout-terms";
import { formatDate } from "@/lib/utils";

const APPLICATION_LABELS: Record<string, string> = {
  pending: "Waiting to hear back",
  accepted: "Accepted",
  declined: "Not this time",
  withdrawn: "Withdrawn",
};

// Adding a post reads it from its platform before answering, which can take a while.
export const maxDuration = 60;

export default async function JobDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?next=/dashboard/recruiting/jobs/${id}`);
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("*, niches(label)")
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();
  const terms = parsePayoutTerms(job.payout_terms);
  // A campaign whose contract pays per post (the Getimg kind) is tracked and paid post by post.
  const postTerms = parsePostTerms(job.post_terms);

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*, niches(label)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Existing application and assignment for this job, if any.
  const [
    { data: application },
    { data: assignment },
    { data: handles },
    { data: videos },
  ] = applicant
    ? await Promise.all([
        supabase
          .from("applications")
          .select("id, status, created_at")
          .eq("applicant_id", applicant.id)
          .eq("job_id", job.id)
          .maybeSingle(),
        supabase
          .from("assignments")
          .select("id, status, proof_url, assigned_at")
          .eq("applicant_id", applicant.id)
          .eq("job_id", job.id)
          .maybeSingle(),
        supabase
          .from("applicant_handles")
          .select("*")
          .eq("applicant_id", applicant.id)
          .order("is_primary", { ascending: false }),
        // The creator's own videos, to apply with (RLS: only their own rows).
        supabase
          .from("applicant_videos")
          .select("id, platform, url, title")
          .eq("applicant_id", applicant.id)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }, { data: null }, { data: null }];

  // What the creator can do next, split the way the page uses it: `cta` is the one
  // button (shown top right), `notice` explains a state
  // in the left panel, and `below` is the longer form for campaigns that need one.
  const joinedUrl = `/dashboard/recruiting/jobs/${job.id}/join`;
  let intro = "Apply to get started: you can add posts as soon as you're on.";
  let cta: React.ReactNode = null;
  let notice: React.ReactNode = null;
  let below: React.ReactNode = null;

  if (!applicant) {
    intro = "Set up your profile to apply to this campaign.";
    cta = (
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href="/dashboard/recruiting/profile-setup" />}
      >
        Set up my profile to apply
      </Button>
    );
  } else if (assignment && postTerms) {
    intro = "You're on this campaign. Add each post as you publish it.";
    cta = <SubmitPost assignmentId={assignment.id} originals={await repostChoices(assignment.id)} />;
  } else if (assignment) {
    intro = assignment.proof_url
      ? "Your post is in. You can send a different link if it changes."
      : "You're on this campaign. Post your video, then submit the link.";
    cta = (
      <SubmitContent
        assignmentId={assignment.id}
        platform={job.platform}
        currentProofUrl={assignment.proof_url}
        label={assignment.proof_url ? "Update my post" : "Submit content"}
      />
    );
  } else if (job.status !== "open") {
    intro = "This campaign isn't open any more.";
    cta = (
      <Button
        size="lg"
        variant="outline"
        className="w-full"
        nativeButton={false}
        render={<Link href="/dashboard/recruiting/jobs" />}
      >
        Browse campaigns
      </Button>
    );
  } else if (application && application.status !== "withdrawn") {
    intro = "You applied to this campaign.";
    notice = (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            tone={
              application.status === "accepted"
                ? "success"
                : application.status === "declined"
                  ? "error"
                  : "pending"
            }
          >
            {APPLICATION_LABELS[application.status]}
          </StatusBadge>
          <span className="text-sm text-muted-foreground">
            Sent {formatDate(application.created_at)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {application.status === "pending"
            ? "We review applications by hand. You'll get an email either way."
            : application.status === "declined"
              ? "Not a fit for this one, but it doesn't affect future campaigns."
              : "Check your dashboard for the brief."}
        </p>
      </div>
    );
    cta = (
      <Button
        size="lg"
        variant="outline"
        className="w-full"
        nativeButton={false}
        render={<Link href="/dashboard/recruiting/jobs" />}
      >
        Browse more campaigns
      </Button>
    );
  } else if (job.sample_required) {
    // The brand wants to see a sample first, so this one is an application.
    intro =
      "This brand wants a sample video first, so each application is reviewed.";
    if (applicant.status !== "approved") {
      notice = (
        <div className="rounded-xl border border-border/70 bg-card p-4">
          <p className="font-semibold text-foreground">
            {applicant.status === "pending"
              ? "Your profile is under review"
              : "Your profile isn't eligible right now"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {applicant.status === "pending"
              ? "We check new creators by hand, usually within a few days. Once you're approved you can apply to campaigns like this one."
              : "If you think that's a mistake, get in touch and we'll take another look."}
          </p>
        </div>
      );
    } else {
      below = (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Apply for this campaign
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Your profile and videos go with your application.
          </p>
          <ProfileCard
            applicant={applicant}
            handles={handles ?? []}
            variant="self"
          />
          <div className="mt-6">
            <ApplyForm
              jobId={job.id}
              videos={(videos ?? []) as VideoItem[]}
              sampleRequired={job.sample_required}
              sampleCriteria={job.sample_criteria}
            />
          </div>
        </section>
      );
    }
  } else if (!(handles ?? []).some((h) => h.verified_at)) {
    // Your views are counted on your own accounts, so one has to be connected first.
    intro = "Connect and verify one of your accounts first. Then come back to this page and press Apply: connecting an account does not apply for you.";
    cta = (
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href="/dashboard/account/accounts" />}
      >
        Connect an account first
      </Button>
    );
  } else {
    cta = (
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<Link href={joinedUrl} />}
      >
        Apply to this campaign
      </Button>
    );
  }

  return (
    <CampaignView
      job={job}
      terms={terms}
      postTerms={postTerms}
      intro={intro}
      cta={cta}
      notice={notice}
      below={below}
    />
  );
}
