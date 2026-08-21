import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, assignmentStatusTone, applicantStatusTone } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ProofForm } from "./ProofForm";
import { ApplicationsList, type ApplicationRow } from "./ApplicationsList";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileStrength } from "@/components/app/ProfileStrength";
import { profileCompleteness } from "@/lib/profile-completeness";
import { formatCurrency, formatDate, PLATFORM_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  active: "In progress",
  submitted: "Under review",
  paid: "Paid",
  disputed: "Needs attention",
};

const APPLICANT_STATUS_LABELS: Record<string, string> = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Not approved",
};

export default async function DashboardPage(props: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await props.searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/recruiting");

  const { data: applicant } = await supabase
    .from("applicants")
    .select("*, niches(label)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const [{ data: handles }, { data: applications }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("applicant_handles")
        .select("*")
        .eq("applicant_id", applicant.id)
        .order("is_primary", { ascending: false }),
      supabase
        .from("applications")
        .select(
          "id, status, created_at, jobs(id, title, platform, payout_type, payout_amount)",
        )
        .eq("applicant_id", applicant.id)
        .order("created_at", { ascending: false }),
      // assignments join to jobs, never to payouts — gross_amount is admin-only
      // at the RLS layer and has no path to this page.
      supabase
        .from("assignments")
        .select(
          "id, status, proof_url, applicant_payout_amount, assigned_at, paid_at, jobs(id, title, platform, notion_sop_url, description)",
        )
        .eq("applicant_id", applicant.id)
        .order("assigned_at", { ascending: false }),
    ]);

  const active = assignments ?? [];
  const apps = (applications ?? []) as ApplicationRow[];
  const completeness = profileCompleteness(applicant, handles ?? []);

  const earned = active
    .filter((a) => a.status === "paid")
    .reduce((sum, a) => sum + Number(a.applicant_payout_amount), 0);
  const pendingPay = active
    .filter((a) => a.status === "active" || a.status === "submitted")
    .reduce((sum, a) => sum + Number(a.applicant_payout_amount), 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 lg:py-10">
      {welcome && (
        <div className="mb-6 rounded-lg bg-toy-soft/50 px-5 py-4">
          <p className="font-heading font-semibold text-toy-soft-foreground">
            Your profile is in — nice work.
          </p>
          <p className="mt-1 text-[15px] text-toy-soft-foreground">
            We review new creators by hand. You&apos;ll hear from us once
            you&apos;re approved.
          </p>
        </div>
      )}

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            Hi, {applicant.name.split(" ")[0]}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
            <span>
              @{applicant.handle} · {PLATFORM_LABELS[applicant.platform]}
            </span>
            <StatusBadge tone={applicantStatusTone(applicant.status)}>
              {APPLICANT_STATUS_LABELS[applicant.status]}
            </StatusBadge>
          </p>
        </div>
        {applicant.status === "approved" && (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/recruiting/jobs" />}
          >
            Browse campaigns
          </Button>
        )}
      </header>

      {/* Summary before detail — the numbers you'd want at a glance. */}
      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active campaigns" value={String(active.filter((a) => a.status === "active" || a.status === "submitted").length)} />
        <Stat label="Applications out" value={String(apps.filter((a) => a.status === "pending").length)} />
        <Stat label="Pending payment" value={formatCurrency(pendingPay)} />
        <Stat label="Paid to date" value={formatCurrency(earned)} tone="success" />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ---- Main column ---- */}
        <div className="flex flex-col gap-8">
          <section id="campaigns" className="scroll-mt-20">
            <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
              Your campaigns
            </h2>

            {active.length === 0 ? (
              <Card className="border-border/70 py-10 text-center">
              <CardContent>
                {applicant.status === "pending" ? (
                  <>
                    <Clock size={28} className="mx-auto text-accent" />
                    <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      Your profile is under review
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                      We go through new creators by hand, usually within a few
                      days. Once approved you can apply to campaigns.
                    </p>
                  </>
                ) : applicant.status === "approved" ? (
                  <>
                    <CheckCircle2 size={28} className="mx-auto text-toy-soft-foreground" />
                    <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      No campaigns yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                      Apply to anything open that fits you, and we&apos;ll get
                      back to you.
                    </p>
                    <Button
                      className="mt-5"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href="/dashboard/recruiting/jobs" />}
                    >
                      Browse open jobs
                    </Button>
                  </>
                ) : (
                  <>
                    <TriangleAlert size={28} className="mx-auto text-destructive" />
                    <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
                      Your profile isn&apos;t approved
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                      If you think that&apos;s a mistake, get in touch and
                      we&apos;ll take another look.
                    </p>
                  </>
                )}
              </CardContent>
              </Card>
            ) : (
              <ul className="flex flex-col gap-4">
                {active.map((a) => {
                  const job = a.jobs;
                  return (
                    <li key={a.id}>
                      <Card className="border-border/70">
                      <CardContent>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-heading text-lg font-semibold text-foreground">
                              {job?.title ?? "Campaign"}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Assigned {formatDate(a.assigned_at)}
                              {job?.platform
                                ? ` · ${PLATFORM_LABELS[job.platform]}`
                                : ""}
                            </p>
                          </div>
                          <StatusBadge tone={assignmentStatusTone(a.status)}>
                            {ASSIGNMENT_STATUS_LABELS[a.status]}
                          </StatusBadge>
                        </div>

                        <div className="mt-4 rounded-md bg-muted/50 px-4 py-3">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Your payout
                          </p>
                          <p className="mt-0.5 font-heading text-2xl font-semibold text-primary">
                            {formatCurrency(a.applicant_payout_amount)}
                          </p>
                          {a.status === "paid" && a.paid_at && (
                            <p className="mt-1 text-sm font-semibold text-toy-soft-foreground">
                              Paid {formatDate(a.paid_at)}
                            </p>
                          )}
                        </div>

                        {job?.description && (
                          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
                            {job.description}
                          </p>
                        )}

                        {job?.notion_sop_url && (
                          <a
                            href={job.notion_sop_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80"
                          >
                            Read the campaign instructions →
                          </a>
                        )}

                        {a.status === "active" && (
                          <div className="mt-4 border-t border-border pt-4">
                            <ProofForm
                              assignmentId={a.id}
                              currentProofUrl={a.proof_url}
                            />
                          </div>
                        )}

                        {a.status === "submitted" && a.proof_url && (
                          <div className="mt-4 border-t border-border pt-4">
                            <p className="text-[15px] text-muted-foreground">
                              You submitted{" "}
                              <a
                                href={a.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-primary underline underline-offset-2"
                              >
                                your post
                              </a>
                              . We&apos;ll review it and release payment.
                            </p>
                          </div>
                        )}

                        {a.status === "disputed" && (
                          <div className="mt-4 border-t border-border pt-4">
                            <p className="text-[15px] text-muted-foreground">
                              There&apos;s a problem with this submission. Check
                              your email — we&apos;ve been in touch.
                            </p>
                          </div>
                        )}
                      </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {apps.length > 0 && (
            <div id="applications" className="scroll-mt-20">
              <ApplicationsList applications={apps} />
            </div>
          )}
        </div>

        {/* ---- Side rail ---- */}
        <aside className="flex flex-col gap-6">
          <ProfileStrength completeness={completeness} />

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">
                Your profile card
              </h2>
              <Link
                href="/dashboard/recruiting/profile-setup"
                className="text-sm font-semibold text-primary underline underline-offset-2"
              >
                Edit
              </Link>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Exactly what we see when you apply.
            </p>
            <ProfileCard
              applicant={applicant}
              handles={handles ?? []}
              variant="self"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 font-heading text-xl font-semibold tabular-nums ${
          tone === "success" ? "text-toy-soft-foreground" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
