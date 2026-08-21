import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import {
  PLATFORM_LABELS,
  ACCOUNT_REQUIREMENT_LABELS,
  formatPayoutSummary,
} from "@/lib/utils";
import type { Job } from "@/lib/database.types";

interface JobCardProps {
  job: Job & { niches: { label: string } | null };
  href: string;
}

// Shows platform / niche / payout / requirement only. Brand names and campaign
// specifics live in `description`, which is intentionally NOT rendered here —
// those are only shared with an applicant once they're assigned.
export function JobCard({ job, href }: JobCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col border-border/70 transition-colors hover:bg-muted/40">
        <CardContent className="flex h-full flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{PLATFORM_LABELS[job.platform]}</StatusBadge>
          {job.niches && <StatusBadge tone="neutral">{job.niches.label}</StatusBadge>}
          <StatusBadge tone={jobStatusTone(job.status)} className="ml-auto">
            {job.status === "open"
              ? "Open"
              : job.status === "filled"
                ? "Filled"
                : "Closed"}
          </StatusBadge>
        </div>

        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          {job.title}
        </h3>

        <p className="mt-3 font-heading text-xl font-semibold text-primary">
          {formatPayoutSummary(job.payout_type, job.payout_amount)}
        </p>
        {job.payout_notes && (
          <p className="mt-1 text-sm text-muted-foreground">
            {job.payout_notes}
          </p>
        )}

        <p className="mt-auto pt-4 text-sm text-muted-foreground">
          {ACCOUNT_REQUIREMENT_LABELS[job.account_requirement]}
        </p>
        </CardContent>
      </Card>
    </Link>
  );
}
