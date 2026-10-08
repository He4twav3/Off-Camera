import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { PLATFORM_LABELS, formatPayoutSummary } from "@/lib/utils";
import type { Job } from "@/lib/database.types";
import { CampaignBanner } from "@/components/app/CampaignBanner";
import { parsePayoutTerms, termsChips } from "@/lib/payout-terms";
import { parsePostTerms, postTermsChips } from "@/lib/post-terms";

interface JobCardProps {
  job: Job & { niches: { label: string } | null };
  href: string;
}

// Banner with the pay, then the title and the small print. Brand names and campaign
// specifics live in `description`, which is intentionally NOT rendered here: those
// are only shared once you've joined.
export function JobCard({ job, href }: JobCardProps) {
  const terms = parsePayoutTerms(job.payout_terms);
  const postTerms = parsePostTerms(job.post_terms);
  const chips = postTerms
    ? postTermsChips(postTerms)
    : terms
      ? termsChips(terms)
      : [];
  const headline =
    chips[0] ?? formatPayoutSummary(job.payout_type, job.payout_amount);
  const extra = chips[1] ?? null;

  // "$20 per post" reads best as a big amount with the unit beside it.
  const split = headline.match(/^(\$[\d.,]+[KkMm]?)\s+(.+)$/);
  const closed = job.status !== "open";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative">
        <CampaignBanner
          seed={job.id}
          headline={headline}
          caption={PLATFORM_LABELS[job.platform]}
          logoUrl={job.logo_url}
          className="aspect-[2/1] transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute top-3 left-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
          {PLATFORM_LABELS[job.platform]}
        </span>
        {closed && (
          <span className="absolute top-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 backdrop-blur">
            {job.status === "filled" ? "Filled" : "Closed"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-lg font-semibold text-foreground">
            {job.title}
          </h3>
          {job.niches?.label && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {job.niches.label}
            </p>
          )}
        </div>

        {/* With a logo on top, the pay is shown here. Without one, the banner already shows it. */}
        <div className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4">
          {job.logo_url && (
            <p className="flex items-baseline gap-1.5">
              {split ? (
                <>
                  <span className="font-heading text-3xl leading-none font-bold tracking-tight text-foreground">
                    {split[1]}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {split[2]}
                  </span>
                </>
              ) : (
                <span className="font-heading text-xl font-semibold text-foreground">
                  {headline}
                </span>
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {extra && !closed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                <TrendingUp className="size-3.5" />
                {extra}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-80 transition-all group-hover:gap-2 group-hover:opacity-100">
              View
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
