import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProfileCard } from "@/components/ProfileCard";
import { ReviewActions } from "./ReviewActions";
import { formatDate, formatPayoutSummary, PLATFORM_LABELS } from "@/lib/utils";
import type { Applicant, ApplicantHandle } from "@/lib/database.types";

export const metadata: Metadata = { title: "Applications · Admin" };

const STATUS_TONE = {
  pending: "pending",
  accepted: "success",
  declined: "error",
  withdrawn: "closed",
} as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Needs a decision",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn by them",
};

export default async function AdminApplicationsPage() {
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, cover_note, created_at, decided_at, jobs(id, title, platform, payout_type, payout_amount), applicants(*, niches(label))",
    )
    .order("created_at", { ascending: false });

  const all = applications ?? [];
  const pending = all.filter((a) => a.status === "pending");
  const decided = all.filter((a) => a.status !== "pending");

  // Handles for everyone on this page, fetched once rather than per row.
  const applicantIds = [
    ...new Set(all.map((a) => a.applicants?.id).filter(Boolean) as string[]),
  ];
  const { data: allHandles } = applicantIds.length
    ? await supabase
        .from("applicant_handles")
        .select("*")
        .in("applicant_id", applicantIds)
        .order("is_primary", { ascending: false })
    : { data: [] };

  const handlesByApplicant = new Map<string, ApplicantHandle[]>();
  for (const h of allHandles ?? []) {
    const list = handlesByApplicant.get(h.applicant_id) ?? [];
    list.push(h);
    handlesByApplicant.set(h.applicant_id, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Applications
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {pending.length} waiting on you · {all.length} total
        </p>
      </header>

      {all.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              No applications yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              Approved creators can apply to any open campaign, and they&apos;ll
              land here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                Waiting on you
              </h2>
              <ul className="flex flex-col gap-5">
                {pending.map((app) => (
                  <li key={app.id}>
                    <ApplicationRow
                      app={app}
                      handles={
                        handlesByApplicant.get(app.applicants?.id ?? "") ?? []
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {decided.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                Already decided
              </h2>
              <ul className="flex flex-col gap-5">
                {decided.map((app) => (
                  <li key={app.id}>
                    <ApplicationRow
                      app={app}
                      handles={
                        handlesByApplicant.get(app.applicants?.id ?? "") ?? []
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface RowProps {
  app: {
    id: string;
    status: string;
    cover_note: string | null;
    created_at: string;
    decided_at: string | null;
    jobs: {
      id: string;
      title: string;
      platform: string;
      payout_type: "flat" | "cpm" | "retainer";
      payout_amount: number;
    } | null;
    applicants: (Applicant & { niches: { label: string } | null }) | null;
  };
  handles: ApplicantHandle[];
}

function ApplicationRow({ app, handles }: RowProps) {
  const job = app.jobs;
  const person = app.applicants;

  return (
    <Card className="border-border/70">
      <CardContent className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={STATUS_TONE[app.status as keyof typeof STATUS_TONE]}>
              {STATUS_LABELS[app.status]}
            </StatusBadge>
            {job && <StatusBadge tone="neutral">{PLATFORM_LABELS[job.platform]}</StatusBadge>}
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            {job ? (
              <Link
                href={`/dashboard/recruiting/jobs/${job.id}`}
                className="underline-offset-2 hover:underline"
              >
                {job.title}
              </Link>
            ) : (
              "Campaign removed"
            )}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Applied {formatDate(app.created_at)}
            {job
              ? ` · listed at ${formatPayoutSummary(job.payout_type, job.payout_amount)}`
              : ""}
            {app.decided_at ? ` · decided ${formatDate(app.decided_at)}` : ""}
          </p>
        </div>
      </div>

      {app.cover_note && (
        <blockquote className="border-l-2 border-primary pl-4 text-[15px] leading-relaxed text-foreground">
          {app.cover_note}
        </blockquote>
      )}

      {person && (
        <ProfileCard
          applicant={person}
          handles={handles}
          variant="admin"
          className="border-border/60 shadow-none"
        />
      )}

      {app.status === "pending" && job && (
        <ReviewActions
          applicationId={app.id}
          suggestedPayout={job.payout_amount}
        />
      )}
      </CardContent>
    </Card>
  );
}
