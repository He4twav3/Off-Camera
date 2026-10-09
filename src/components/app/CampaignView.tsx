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
import { CommissionNote } from "@/components/app/CommissionNote";
import {
  describeTerms,
  termsChips,
  type PayoutTerms,
} from "@/lib/payout-terms";
import {
  describePostTerms,
  postTermsChips,
  type PostTerms,
} from "@/lib/post-terms";
import { compactViews } from "@/lib/format";
import { postIdentity } from "@/lib/post-key";
import { PlatformIcon } from "@/components/account/PlatformIcons";
import { PLATFORM_LABELS, formatPayoutSummary } from "@/lib/utils";
import type { Job } from "@/lib/database.types";

/**
 * One campaign: a left panel (banner, tags, and the one thing to do next, passed
 * in as `action`) and a main column (how it pays, then the brief as a checklist).
 */
export function CampaignView({
  job,
  terms,
  postTerms = null,
  results,
  intro,
  cta,
  notice,
  below,
  back = { href: "/dashboard/recruiting/jobs", label: "← Campaigns" },
}: {
  job: Job & { niches: { label: string } | null };
  terms: PayoutTerms | null;
  /** Set for a campaign whose contract pays per post (lib/post-terms.ts). */
  postTerms?: PostTerms | null;
  /** The creator's own results on this campaign, shown under how it pays. */
  results?: ReactNode;
  intro: string;
  cta?: ReactNode;
  notice?: ReactNode;
  below?: ReactNode;
  /** Where the small link over the banner goes (a brand previewing its own campaign goes back to its page). */
  back?: { href: string; label: string };
}) {
  const chips = postTerms
    ? postTermsChips(postTerms)
    : terms
      ? termsChips(terms)
      : [];
  const headline =
    chips[0] ?? formatPayoutSummary(job.payout_type, job.payout_amount);
  const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
  const topBonus = postTerms?.milestones.at(-1);
  const stats = postTerms
    ? ([
        postTerms.basePerPost > 0
          ? {
              icon: DollarSign,
              label: `${usd(postTerms.basePerPost)} per post`,
            }
          : null,
        topBonus
          ? {
              icon: TrendingUp,
              label: `Bonus up to ${usd(topBonus.amount)} per post`,
            }
          : null,
        { icon: Video, label: `Paid every ${postTerms.cycleSize} posts` },
        { icon: Eye, label: `${postTerms.windowDays}-day counting window` },
      ].filter(Boolean) as { icon: typeof Eye; label: string }[])
    : ([
        terms?.cpm
          ? {
              icon: DollarSign,
              label: `$${terms.cpm.ratePer1000} per 1K views`,
            }
          : null,
        terms && terms.cpm && terms.cpm.startsAt > 0
          ? {
              icon: Eye,
              label: `${compactViews(terms.cpm.startsAt)} min views`,
            }
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
      ].filter(Boolean) as { icon: typeof Eye; label: string }[]);
  const payLines = postTerms
    ? describePostTerms(postTerms)
    : terms
      ? describeTerms(terms)
      : [];
  // The brief as a checklist: one line, one rule.
  const rules = (job.description ?? "")
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\u2022]+/, "").trim())
    .filter(Boolean);

  // The brand's own words for this campaign (see the admin job form).
  const formatList = (job.formats ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const examples = (job.example_urls ?? []).flatMap((url) => {
    const id = postIdentity(url);
    return id.ok ? [{ url: id.url, platform: id.platform }] : [];
  });

  const sub = job.niches?.label ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
        {/* Left panel: the campaign, where you are in it, and the button, pinned at the bottom. */}
        <aside className="flex flex-col gap-3 lg:gap-5 lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
          <div className="relative">
            <CampaignBanner
              seed={job.id}
              headline={headline}
              caption={PLATFORM_LABELS[job.platform]}
              className="aspect-[16/10] max-h-28 rounded-xl sm:max-h-56 lg:max-h-none"
              logoUrl={job.logo_url}
            />
            <Link
              href={back.href}
              className="absolute top-2.5 left-2.5 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur hover:bg-black/70"
            >
              {back.label}
            </Link>
          </div>

          <div className="hidden lg:block">
            <h1 className="font-heading text-lg leading-snug font-semibold text-foreground">
              {job.title}
            </h1>
            {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
          </div>

          <nav aria-label="Campaign" className="hidden flex-col gap-0.5 lg:flex">
            <span
              aria-current="page"
              className="flex min-h-10 items-center gap-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              <LayoutGrid className="size-4" />
              Overview
            </span>
          </nav>

          {notice}
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

          {
            <>
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
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
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-xl border border-border/70 bg-card px-4 py-2.5 sm:gap-x-6 sm:gap-y-2 sm:px-5 sm:py-3.5">
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
                {payLines.length > 0 && (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {payLines.map((line) => (
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

              {results}

              {/* What the brand says about itself and the content it wants. */}
              {job.about && (
                <section className="mt-4 rounded-xl sm:mt-6 border border-border/70 bg-card px-4 py-3 sm:px-5 sm:py-4">
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    About the brand
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
                    {job.about}
                  </p>
                </section>
              )}

              {formatList.length > 0 && (
                <section className="mt-4 rounded-xl sm:mt-6 border border-border/70 bg-card px-4 py-3 sm:px-5 sm:py-4">
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Formats that work
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2 text-[15px] text-foreground">
                    {formatList.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Video className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {examples.length > 0 && (
                <section className="mt-6">
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Examples
                  </h2>
                  <p className="mt-0.5 mb-3 text-sm text-muted-foreground">
                    Posts that show the kind of content this campaign is after.
                  </p>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {examples.map((e) => (
                      <li key={e.url}>
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex aspect-[4/3] flex-col justify-between rounded-lg border border-border/70 bg-card p-3 transition-colors hover:border-primary/40"
                        >
                          <PlatformIcon
                            platform={e.platform}
                            className="size-6"
                          />
                          <span className="text-sm font-medium text-foreground">
                            Watch example
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {rules.length > 0 && (
                <section className="mt-5 rounded-xl sm:mt-8 border border-border/70 bg-card px-4 py-3 sm:px-5 sm:py-4">
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

              {!job.logo_url && (
                <p className="mt-4 text-sm text-muted-foreground">
                  The brand name is shared once you&apos;ve joined this
                  campaign.
                </p>
              )}
              <CommissionNote className="mt-3" />
            </>
          }

          {below}
        </div>
      </div>
    </div>
  );
}
