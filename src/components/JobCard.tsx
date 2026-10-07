import Link from "next/link";
import {
  PLATFORM_LABELS,
  ACCOUNT_REQUIREMENT_LABELS,
  formatPayoutSummary,
} from "@/lib/utils";
import type { Job } from "@/lib/database.types";
import { CampaignBanner } from "@/components/app/CampaignBanner";
import { parsePayoutTerms, termsChips } from "@/lib/payout-terms";

interface JobCardProps {
  job: Job & { niches: { label: string } | null };
  href: string;
}

// Banner with the pay, then the title and the small print. Brand names and campaign
// specifics live in `description`, which is intentionally NOT rendered here: those
// are only shared once you've joined.
export function JobCard({ job, href }: JobCardProps) {
  const terms = parsePayoutTerms(job.payout_terms);
  const chips = terms ? termsChips(terms) : [];
  const headline =
    chips[0] ?? formatPayoutSummary(job.payout_type, job.payout_amount);
  const extra = chips[1] ?? null;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-primary/40"
    >
      <CampaignBanner
        seed={job.id}
        headline={headline}
        caption={PLATFORM_LABELS[job.platform]}
        className="aspect-[16/9]"
      />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-foreground">
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {[
              job.niches?.label,
              ACCOUNT_REQUIREMENT_LABELS[job.account_requirement],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {job.status !== "open" ? (
          <span className="shrink-0 rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {job.status === "filled" ? "Filled" : "Closed"}
          </span>
        ) : (
          extra && (
            <span className="shrink-0 rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              {extra}
            </span>
          )
        )}
      </div>
    </Link>
  );
}
