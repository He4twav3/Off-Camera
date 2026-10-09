import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProfileCard } from "@/components/ProfileCard";
import { ReviewActions } from "./ReviewActions";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteApplicationAction } from "../delete-actions";
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
      "id, status, cover_note, sample_url, video_urls, created_at, decided_at, jobs(id, title, platform, payout_type, payout_amount), applicants(*, niches(label))",
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
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
              <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Already decided</h2>
              <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
                {decided.map((app) => (
                  <li key={app.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                    <StatusBadge tone={STATUS_TONE[app.status as keyof typeof STATUS_TONE]}>
                      {STATUS_LABELS[app.status]}
                    </StatusBadge>
                    <span className="font-medium text-foreground">{app.applicants?.name ?? "Creator removed"}</span>
                    <span className="text-muted-foreground">
                      {app.jobs ? app.jobs.title : "Campaign removed"} · applied {formatDate(app.created_at)}
                    </span>
                    <span className="ml-auto">
                      <ConfirmDelete action={deleteApplicationAction} id={app.id} what="this application" />
                    </span>
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
    sample_url: string | null;
    video_urls: string[];
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
      <CardContent className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={STATUS_TONE[app.status as keyof typeof STATUS_TONE]}>
              {STATUS_LABELS[app.status]}
            </StatusBadge>
            {job && <StatusBadge tone="neutral">{PLATFORM_LABELS[job.platform]}</StatusBadge>}
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            {job ? job.title : "Campaign removed"}
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

      {app.video_urls.length > 0 && (
        <div>
          <p className="text-[15px] font-semibold text-foreground">
            Applied with {app.video_urls.length} {app.video_urls.length === 1 ? "video" : "videos"}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {app.video_urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm font-semibold text-primary underline underline-offset-2"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {app.sample_url && (
        <p className="text-[15px]">
          <span className="font-semibold text-foreground">Sample video: </span>
          <a
            href={app.sample_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Open in Google Drive
          </a>
          <span className="ml-2 text-sm text-muted-foreground">
            If it asks for access, the creator didn&apos;t set sharing to &quot;Anyone with the link&quot;.
          </span>
        </p>
      )}

      {person && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Their profile: {person.name} (@{person.handle})
          </summary>
          <div className="mt-3">
            <ProfileCard applicant={person} handles={handles} variant="admin" className="border-border/60 shadow-none" />
          </div>
        </details>
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
