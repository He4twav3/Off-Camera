import type { ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  DollarSign,
  Eye,
  LayoutGrid,
  TrendingUp,
  Video,
} from "lucide-react";
import { StatusBadge, jobStatusTone } from "@/components/ui/status-badge";
import { CampaignBanner } from "@/components/app/CampaignBanner";
import { DisclosureNotice } from "@/components/app/DisclosureNotice";
import { CommissionNote } from "@/components/app/CommissionNote";
import {
  describeTerms,
  termsChips,
  type PayoutTerms,
} from "@/lib/payout-terms";
import { compactViews } from "@/lib/format";
import {
  PLATFORM_LABELS,
  ACCOUNT_REQUIREMENT_LABELS,
  formatPayoutSummary,
} from "@/lib/utils";
import type { Job } from "@/lib/database.types";

/**
 * One campaign: a left panel (banner, tags, and the one thing to do next, passed
 * in as `action`) and a main column (how it pays, then the brief as a checklist).
 */
export function CampaignView({
  job,
  terms,
  intro,
  cta,
  notice,
  below,
}: {
  job: Job & { niches: { label: string } | null };
  terms: PayoutTerms | null;
  intro: string;
  cta?: ReactNode;
  notice?: ReactNode;
  below?: ReactNode;
}) {
  const chips = terms ? termsChips(terms) : [];
  const headline =
    chips[0] ?? formatPayoutSummary(job.payout_type, job.payout_amount);
  const stats = [
    terms?.cpm
      ? { icon: DollarSign, label: `$${terms.cpm.ratePer1000} per 1K views` }
      : null,
    terms && terms.cpm && terms.cpm.startsAt > 0
      ? { icon: Eye, label: `${compactViews(terms.cpm.startsAt)} min views` }
      : null,
    terms && terms.capPerCreator !== null
      ? {
          icon: TrendingUp,
          label: `$${terms.capPerCreator.toLocaleString("en-US")} max per creator`,
        }
      : null,
    terms && terms.fixedPerVideo > 0
      ? {
          icon: Video,
          label: `$${terms.fixedPerVideo.toLocaleString("en-US")} per video`,
        }
      : null,
  ].filter(Boolean) as { icon: typeof Eye; label: string }[];
  // The brief as a checklist: one line, one rule.
  const rules = (job.description ?? "")
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\u2022]+/, "").trim())
    .filter(Boolean);

  const sub = [
    job.niches?.label,
    ACCOUNT_REQUIREMENT_LABELS[job.account_requirement],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Left panel: the campaign, where you are in it, and the button, pinned at the bottom. */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
          <div className="relative">
            <CampaignBanner
              seed={job.id}
              headline={headline}
              caption={PLATFORM_LABELS[job.platform]}
              className="aspect-[16/10] rounded-xl"
            />
            <Link
              href="/dashboard/recruiting/jobs"
              className="absolute top-2.5 left-2.5 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
            >
              ← Campaigns
            </Link>
          </div>

          <div>
            <h1 className="font-heading text-lg leading-snug font-semibold text-foreground">
              {job.title}
            </h1>
            {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
          </div>

          <nav aria-label="Campaign" className="flex flex-col gap-0.5">
            <span
              aria-current="page"
              className="flex min-h-10 items-center gap-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              <LayoutGrid className="size-4" />
              Overview
            </span>
          </nav>

          {notice}

          {cta && <div className="mt-auto hidden lg:block">{cta}</div>}
        </aside>

        {/* Centre: the offer, how it pays, then the rules. */}
        <div className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 basis-72">
              <p className="font-heading text-[17px] font-semibold text-foreground">
                Earn {headline.charAt(0).toLowerCase() + headline.slice(1)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{intro}</p>
            </div>
            {cta && <div className="w-full sm:w-56">{cta}</div>}
          </header>

          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {job.title}
            </h2>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Video className="size-4" />
              {PLATFORM_LABELS[job.platform]}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.niches && (
              <StatusBadge tone="neutral">{job.niches.label}</StatusBadge>
            )}
            <StatusBadge tone={jobStatusTone(job.status)}>
              {job.status === "open"
                ? "Open"
                : job.status === "filled"
                  ? "Filled"
                  : "Closed"}
            </StatusBadge>
          </div>

          <section className="mt-5">
            <h2 className="sr-only">How this campaign pays</h2>
            {stats.length > 0 ? (
              <ul className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-border/70 bg-card px-5 py-3.5">
                {stats.map((st) => (
                  <li
                    key={st.label}
                    className="flex items-center gap-2 text-[15px] font-semibold text-foreground"
                  >
                    <st.icon className="size-4 text-muted-foreground" />
                    {st.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-border/70 bg-card px-5 py-3.5 font-heading text-xl font-semibold text-primary">
                {formatPayoutSummary(job.payout_type, job.payout_amount)}
              </p>
            )}
            {terms && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {describeTerms(terms).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {job.payout_notes && (
              <p className="mt-3 text-sm text-muted-foreground">
                {job.payout_notes}
              </p>
            )}
          </section>

          {rules.length > 0 && (
            <section className="mt-8 rounded-xl border border-border/70 bg-card px-5 py-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                The brief
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                The key rules. Follow them in every video.
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex items-start gap-3 text-[15px] text-foreground"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            The brand name is shared once you&apos;ve joined this campaign.
          </p>
          <DisclosureNotice className="mt-4" />
          <CommissionNote className="mt-3" />

          {/* On a phone the button sits here, under the rules, instead of in the left panel. */}
          {cta && <div className="mt-6 lg:hidden">{cta}</div>}

          {below}
        </div>
      </div>
    </div>
  );
}
