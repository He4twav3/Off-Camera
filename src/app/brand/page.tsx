import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PageShell, Stat, StatGrid } from "@/components/kit/ui";
import { cpm, platformSplit, topPosts } from "@/lib/brand-stats";
import { PLATFORM_LABELS, formatCurrency } from "@/lib/utils";
import { loadBrandPage } from "./_brand";
import { PendingNotice } from "./PendingNotice";

export const metadata: Metadata = { title: "Overview" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

export default async function BrandOverviewPage() {
  const { brand, ws, approved } = await loadBrandPage("/brand");
  const heading = <PageHeader title={brand.companyName} />;
  if (!approved)
    return (
      <PageShell>
        {heading}
        <PendingNotice status={brand.status} />
      </PageShell>
    );

  if (ws.campaigns.length === 0)
    return (
      <PageShell>
        <PageHeader
          title={brand.companyName}
          actions={
            <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
              <Plus className="size-4" />
              New campaign
            </Button>
          }
        />
        <EmptyState
          title="Launch your first campaign"
          body="Set what you pay per video, write a short brief, and creators can join straight away."
        />
      </PageShell>
    );

  const counted = ws.posts.filter((p) => p.counted);
  const views = counted.reduce((n, p) => n + p.views, 0);
  const earned = ws.campaigns.reduce((n, c) => n + c.earned, 0);
  const paid = ws.campaigns.reduce((n, c) => n + c.paid, 0);
  const due = Math.max(0, ws.campaigns.reduce((n, c) => n + c.payable, 0) - paid);
  const awaiting = ws.campaigns.reduce((n, c) => n + (c.reviewer === "brand" ? c.awaitingReview : 0), 0);
  const cost = cpm(earned, views);
  const split = platformSplit(ws.posts);
  const best = topPosts(ws.posts, 5);
  const maxCampaign = Math.max(1, ...ws.campaigns.map((c) => c.views));

  return (
    <PageShell>
      <PageHeader
        title={brand.companyName}
        actions={
          <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
            <Plus className="size-4" />
            New campaign
          </Button>
        }
      />

      <StatGrid>
        <Stat label="Total views" value={views.toLocaleString()} />
        <Stat label="Videos" value={counted.length.toLocaleString()} hint={`${new Set(ws.creators.map((c) => c.applicantId)).size} creators`} />
        <Stat label="Earned by creators" value={formatCurrency(earned)} hint={cost === null ? "No views yet" : `${formatCurrency(cost)} per 1,000 views`} />
        <Stat label="Still to pay" value={formatCurrency(due)} attention={due > 0} hint={`${formatCurrency(paid)} paid so far`} />
      </StatGrid>

      {awaiting > 0 && (
        <Link
          href="/brand/campaigns"
          className="mb-6 block rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {awaiting} {awaiting === 1 ? "video is" : "videos are"} waiting for your approval →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Views by campaign</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {ws.campaigns.map((c) => (
              <li key={c.id}>
                <Link href={`/brand/campaigns/${c.id}`} className="block">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{c.title}</span>
                    <span className="tabular-nums text-muted-foreground">{c.views.toLocaleString()} views</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (c.views / maxCampaign) * 100)}%` }} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Views by platform</h2>
          {split.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No videos are counting yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {split.map((s) => (
                <li key={s.platform}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">{label(s.platform)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.views.toLocaleString()} views · {s.posts} {s.posts === 1 ? "video" : "videos"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (s.views / Math.max(1, split[0].views)) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold text-foreground">Best videos</h2>
          {best.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Videos appear here once they are counting.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border/70">
              {best.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                  <span className="font-medium text-foreground">{p.creatorName}</span>
                  <span className="text-muted-foreground">
                    {label(p.platform)} · {p.campaignTitle}
                  </span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
                    Watch
                  </a>
                  <span className="ml-auto font-heading text-base font-semibold tabular-nums text-foreground">
                    {p.views.toLocaleString()} views
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Megaphone className="size-4" />
        Views are read from each platform about once a day.
      </p>
    </PageShell>
  );
}
