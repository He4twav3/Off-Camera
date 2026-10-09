import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader, PageShell, Stat, StatGrid } from "@/components/kit/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { postTermsChips } from "@/lib/post-terms";
import { cpm, platformSplit } from "@/lib/brand-stats";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { loadBrandPage } from "../../_brand";
import { PendingNotice } from "../../PendingNotice";
import { CampaignLogoForm } from "../../CampaignLogoForm";
import { ReviewerChoice } from "../../ReviewerChoice";
import { CampaignStatusButton } from "../../CampaignStatusButton";
import { ApprovePostForm, DenyPostForm } from "../../DenyPostForm";

export const metadata: Metadata = { title: "Campaign" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

export default async function BrandCampaignPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { brand, ws, approved } = await loadBrandPage(`/brand/campaigns/${id}`);
  if (!approved)
    return (
      <PageShell>
        <PendingNotice status={brand.status} />
      </PageShell>
    );
  const c = ws.campaigns.find((x) => x.id === id);
  if (!c) notFound();

  const views = c.views;
  const due = Math.max(0, c.payable - c.paid);
  const cost = cpm(c.earned, views);
  const split = platformSplit(c.posts);
  const queue = c.posts.filter((p) => p.counted && p.reviewed === false);
  const ownReview = c.reviewer === "brand";
  const archived = c.posts.filter((p) => p.counted && p.reviewed === true).length;

  return (
    <PageShell>
      <Link href="/brand/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
        ← Campaigns
      </Link>
      <div className="mt-3">
        <PageHeader
          title={c.title}
          summary={
            <span className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={c.status === "open" ? "open" : "closed"}>
                {c.status === "open" ? "Open" : c.status === "filled" ? "Filled" : "Closed"}
              </StatusBadge>
              {c.nicheLabel && <span>{c.nicheLabel}</span>}
              <span>Started {formatDate(c.createdAt)}</span>
            </span>
          }
          actions={
            <>
              <Button variant="outline" nativeButton={false} render={<Link href={`/brand/campaigns/${c.id}/edit`} />}>
                Edit campaign
              </Button>
              <CampaignStatusButton jobId={c.id} status={c.status} />
            </>
          }
        />
      </div>

      {c.terms && (
        <p className="-mt-3 mb-6 flex flex-wrap gap-2">
          {postTermsChips(c.terms).map((chip) => (
            <span key={chip} className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              {chip}
            </span>
          ))}
        </p>
      )}

      <StatGrid>
        <Stat label="Views" value={views.toLocaleString()} />
        <Stat label="Videos" value={c.postsCounted.toLocaleString()} hint={`${c.creators.length} ${c.creators.length === 1 ? "creator" : "creators"}`} />
        <Stat label="Earned by creators" value={formatCurrency(c.earned)} hint={cost === null ? "No views yet" : `${formatCurrency(cost)} per 1,000 views`} />
        <Stat label="Still to pay" value={formatCurrency(due)} attention={due > 0} hint={`${formatCurrency(c.paid)} paid`} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Videos waiting for approval{queue.length > 0 ? ` (${queue.length})` : ""}
            </h2>
            {!ws.reviewAvailable ? (
              <p className="mt-3 text-sm text-muted-foreground">Video approval is being switched on for your account.</p>
            ) : queue.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing waiting. New videos appear here once their account is checked.</p>
            ) : (
              <>
                {!ownReview && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    OnCamera is reviewing these for you. You can still deny any video.
                  </p>
                )}
                <ul className="mt-3 divide-y divide-border/70">
                  {queue.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{p.creatorName}</p>
                        <p className="text-muted-foreground">
                          {label(p.platform)} · {p.views.toLocaleString()} views · added {formatDate(p.submittedAt)}
                        </p>
                      </div>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                        Watch
                      </a>
                      <span className="flex items-center gap-3">
                        {ownReview && <ApprovePostForm postId={p.id} />}
                        <DenyPostForm postId={p.id} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {ws.reviewAvailable && (
              <Link
                href={`/brand/campaigns/${c.id}/archive`}
                className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Archive ({archived})
                <ChevronRight className="size-3" />
              </Link>
            )}
          </section>

          <section className="rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Creators</h2>
            {c.creators.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No creators have joined yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Creator</th>
                      <th className="px-3 py-2 text-right font-medium">Videos</th>
                      <th className="px-3 py-2 text-right font-medium">Views</th>
                      <th className="px-3 py-2 text-right font-medium">Earned</th>
                      <th className="px-3 py-2 text-right font-medium">Paid</th>
                      <th className="w-8 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {[...c.creators].sort((a, b) => b.views - a.views).map((cr) => (
                      <tr key={cr.assignmentId}>
                        <td className="py-2.5 pr-3">
                          <Link href={`/brand/creators/${cr.assignmentId}`} className="font-medium text-foreground hover:underline">
                            {cr.name}
                          </Link>
                          <span className="block text-xs text-muted-foreground">@{cr.handle}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{cr.postsCounted}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{cr.views.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(cr.earned)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(cr.paid)}</td>
                        <td className="py-2.5 text-right">
                          <Link href={`/brand/creators/${cr.assignmentId}`} aria-label={`Open ${cr.name}`}>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Views by platform</h2>
            {split.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No videos are counting yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {split.map((s) => (
                  <li key={s.platform}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium text-foreground">{label(s.platform)}</span>
                      <span className="tabular-nums text-muted-foreground">{s.views.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (s.views / Math.max(1, split[0].views)) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Settings</h2>
            {c.reviewer && <ReviewerChoice jobId={c.id} reviewer={c.reviewer} />}
            <CampaignLogoForm jobId={c.id} logoUrl={c.logoUrl} />
          </section>
        </div>
      </div>
      {c.posts.length === 0 && c.creators.length === 0 && (
        <div className="mt-6">
          <EmptyState title="Waiting for creators" body="Your campaign is live. Creators can find it in their Campaigns list and join." />
        </div>
      )}
    </PageShell>
  );
}
