import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, applicantStatusTone } from "@/components/ui/status-badge";
import { StatusButtons, AssignForm } from "./ApplicantActions";
import { formatCurrency, formatDate, PLATFORM_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Applicants · Admin" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function payRangeLabel(min: number | null, max: number | null) {
  if (min === null && max === null) return "Open to anything";
  if (min !== null && max !== null)
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  if (min !== null) return `${formatCurrency(min)}+`;
  return `Up to ${formatCurrency(max!)}`;
}

export default async function AdminApplicantsPage() {
  const supabase = await createClient();

  const [{ data: applicants }, { data: openJobs }] = await Promise.all([
    supabase
      .from("applicants")
      .select("*, niches(label)")
      .order("created_at", { ascending: false }),
    supabase
      .from("jobs")
      .select("id, title, payout_amount")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  const pending = applicants?.filter((a) => a.status === "pending") ?? [];
  const rest = applicants?.filter((a) => a.status !== "pending") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Applicants
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {pending.length} awaiting review · {applicants?.length ?? 0} total
        </p>
      </header>

      {!applicants || applicants.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              No applicants yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              They&apos;ll show up here once creators complete profile setup.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                Awaiting review
              </h2>
              <ul className="flex flex-col gap-4">
                {pending.map((a) => (
                  <li key={a.id}>
                    <ApplicantCard
                      applicant={a}
                      openJobs={openJobs ?? []}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
                Reviewed
              </h2>
              <ul className="flex flex-col gap-4">
                {rest.map((a) => (
                  <li key={a.id}>
                    <ApplicantCard applicant={a} openJobs={openJobs ?? []} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

interface ApplicantCardProps {
  applicant: {
    id: string;
    name: string;
    email: string;
    handle: string;
    platform: string;
    status: string;
    skills: string[];
    preferred_pay_min: number | null;
    preferred_pay_max: number | null;
    bio: string | null;
    portfolio_url: string | null;
    availability_notes: string | null;
    created_at: string;
    niches: { label: string } | null;
  };
  openJobs: { id: string; title: string; payout_amount: number }[];
}

function ApplicantCard({ applicant: a, openJobs }: ApplicantCardProps) {
  return (
    <Card className="border-border/70">
      <CardContent>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={applicantStatusTone(a.status)}>
              {STATUS_LABELS[a.status]}
            </StatusBadge>
            <StatusBadge tone="neutral">{PLATFORM_LABELS[a.platform]}</StatusBadge>
            {a.niches && <StatusBadge tone="neutral">{a.niches.label}</StatusBadge>}
          </div>

          <h3 className="mt-3 font-heading text-lg font-semibold text-foreground">
            {a.name}{" "}
            <span className="font-sans text-[15px] font-normal text-muted-foreground">
              @{a.handle}
            </span>
          </h3>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {a.email} · Applied {formatDate(a.created_at)}
          </p>

          <dl className="mt-4 flex flex-col gap-2 text-[15px]">
            <div className="flex flex-wrap gap-2">
              <dt className="font-semibold text-foreground">Pay range:</dt>
              <dd className="text-muted-foreground">
                {payRangeLabel(a.preferred_pay_min, a.preferred_pay_max)}
              </dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <dt className="font-semibold text-foreground">Skills:</dt>
              <dd className="text-muted-foreground">
                {a.skills.length > 0 ? a.skills.join(", ") : "None listed"}
              </dd>
            </div>
            {a.availability_notes && (
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-foreground">Availability:</dt>
                <dd className="text-muted-foreground">
                  {a.availability_notes}
                </dd>
              </div>
            )}
            {a.portfolio_url && (
              <div className="flex flex-wrap gap-2">
                <dt className="font-semibold text-foreground">Portfolio:</dt>
                <dd>
                  <a
                    href={a.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {a.portfolio_url}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {a.bio && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {a.bio}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          <StatusButtons applicantId={a.id} status={a.status} />
        </div>
      </div>

      {a.status === "approved" && openJobs.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <AssignForm applicantId={a.id} openJobs={openJobs} />
        </div>
      )}
      </CardContent>
    </Card>
  );
}
