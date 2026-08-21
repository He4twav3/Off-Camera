import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/ProfileCard";
import { ApplyForm } from "./ApplyForm";
import {
  PLATFORM_LABELS,
  PAYOUT_TYPE_LABELS,
  ACCOUNT_REQUIREMENT_LABELS,
  formatPayoutSummary,
  formatDate,
} from "@/lib/utils";

const APPLICATION_LABELS: Record<string, string> = {
  pending: "Waiting to hear back",
  accepted: "Accepted",
  declined: "Not this time",
  withdrawn: "Withdrawn",
};

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

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*, niches(label)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Existing application and assignment for this job, if any.
  const [{ data: application }, { data: assignment }, { data: handles }] =
    applicant
      ? await Promise.all([
          supabase
            .from("applications")
            .select("id, status, created_at")
            .eq("applicant_id", applicant.id)
            .eq("job_id", job.id)
            .maybeSingle(),
          supabase
            .from("assignments")
            .select("id")
            .eq("applicant_id", applicant.id)
            .eq("job_id", job.id)
            .maybeSingle(),
          supabase
            .from("applicant_handles")
            .select("*")
            .eq("applicant_id", applicant.id)
            .order("is_primary", { ascending: false }),
        ])
      : [{ data: null }, { data: null }, { data: null }];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link
        href="/dashboard/recruiting/jobs"
        className="text-sm font-semibold text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80"
      >
        ← Back to all jobs
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <StatusBadge tone="neutral">{PLATFORM_LABELS[job.platform]}</StatusBadge>
        {job.niches && <StatusBadge tone="neutral">{job.niches.label}</StatusBadge>}
        <StatusBadge tone={jobStatusTone(job.status)}>
          {job.status === "open"
            ? "Open"
            : job.status === "filled"
              ? "Filled"
              : "Closed"}
        </StatusBadge>
      </div>

      <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {job.title}
      </h1>

      <Card className="mt-8 border-border/70">
        <CardContent>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">
              Payout
            </dt>
            <dd className="mt-1 font-heading text-2xl font-semibold text-primary">
              {formatPayoutSummary(job.payout_type, job.payout_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">
              Payout type
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
              {PAYOUT_TYPE_LABELS[job.payout_type]}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted-foreground">
              Account requirement
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
              {ACCOUNT_REQUIREMENT_LABELS[job.account_requirement]}
            </dd>
          </div>
          {job.payout_notes && (
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                Payout notes
              </dt>
              <dd className="mt-1 text-[15px] text-foreground">
                {job.payout_notes}
              </dd>
            </div>
          )}
        </dl>
        </CardContent>
      </Card>

      {job.description && (
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            About this campaign
          </h2>
          <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {job.description}
          </p>
          <p className="mt-4 rounded-md bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
            The brand name and full brief are shared with you once you&apos;re
            assigned to this campaign.
          </p>
        </section>
      )}

      {/* ---- Apply / status ---- */}
      <section className="mt-10">
        {!applicant ? (
          <Card className="border-border/70">
            <CardContent>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Finish your profile to apply
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Your profile is what gets sent when you apply, so it needs to be
              filled in first. Takes about three minutes.
            </p>
            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href="/dashboard/recruiting/profile-setup" />}
            >
              Set up my profile
            </Button>
            </CardContent>
          </Card>
        ) : assignment ? (
          <Card className="border-border/70">
            <CardContent>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              You&apos;re on this campaign
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Head to your dashboard for the brief and to submit your post.
            </p>
            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href="/dashboard/recruiting" />}
            >
              Go to dashboard
            </Button>
            </CardContent>
          </Card>
        ) : application && application.status !== "withdrawn" ? (
          <Card className="border-border/70">
            <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                You applied to this campaign
              </h2>
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
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Sent {formatDate(application.created_at)}.{" "}
              {application.status === "pending"
                ? "We review applications by hand — you'll get an email either way."
                : application.status === "declined"
                  ? "Not a fit for this one, but it doesn't affect future campaigns."
                  : "Check your dashboard for the brief."}
            </p>
            <Button
              className="mt-5"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/recruiting" />}
            >
              Track it on my dashboard
            </Button>
            </CardContent>
          </Card>
        ) : applicant.status !== "approved" ? (
          <Card className="border-border/70">
            <CardContent>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {applicant.status === "pending"
                ? "Your profile is under review"
                : "Your profile isn't eligible right now"}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {applicant.status === "pending"
                ? "We check new creators by hand, usually within a few days. Once you're approved you can apply to campaigns like this one."
                : "If you think that's a mistake, get in touch and we'll take another look."}
            </p>
            </CardContent>
          </Card>
        ) : job.status !== "open" ? (
          <Card className="border-border/70">
            <CardContent>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              This campaign isn&apos;t taking applications
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              It&apos;s already been filled. Have a look at what else is open.
            </p>
            <Button
              className="mt-5"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/recruiting/jobs" />}
            >
              Browse open jobs
            </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Apply for this campaign
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              This is what we&apos;ll see. Everything on it comes from your
              profile, so{" "}
              <Link
                href="/dashboard/recruiting/profile-setup"
                className="font-semibold text-primary underline underline-offset-2"
              >
                update your profile
              </Link>{" "}
              if anything looks out of date.
            </p>

            <ProfileCard
              applicant={applicant}
              handles={handles ?? []}
              variant="self"
              className="mt-5"
            />

            <div className="mt-6">
              <ApplyForm jobId={job.id} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
