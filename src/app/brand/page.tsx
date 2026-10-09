import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, PageHeader, PageShell, Stat, StatGrid } from "@/components/kit/ui";
import { cpm, topPosts } from "@/lib/brand-stats";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { loadBrandPage } from "./_brand";
import { PendingNotice } from "./PendingNotice";

export const metadata: Metadata = { title: "Campaigns" };

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;
const STATUS = {
  open: { label: "Open", tone: "open" as const },
  filled: { label: "Filled", tone: "closed" as const },
  closed: { label: "Closed", tone: "closed" as const },
};

/**
 * The brand's home: the whole picture (views, what creators earned, what is still to pay), then each campaign,
 * which opens to edit it and see its creators. Overview and Campaigns used to be two pages saying the same thing.
 */
export default async function BrandHomePage() {
  const { brand, ws, approved } = await loadBrandPage("/brand");
  const newCampaign = (
    <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
      <Plus className="size-4" />
      New campaign
    </Button>
  );
  if (!approved)
    return (
      <PageShell>
        <PageHeader title={brand.companyName} />
        <PendingNotice status={brand.status} />
      </PageShell>
    );

  if (ws.campaigns.length === 0)
    return (
      <PageShell>
        <PageHeader title={brand.companyName} actions={newCampaign} />
        <EmptyState
          title="Launch your first campaign"
          body="Choose who approves your videos, set what you pay per video and write a short brief. Creators can join straight away."
        />
      </PageShell>
    );

  const counted = ws.posts.filter((p) => p.counted);
  const views = counted.reduce((n, p) => n + p.views, 0);
  const earned = ws.campaigns.reduce((n, c) => n + c.earned, 0);
  const paid = ws.campaigns.reduce((n, c) => n + c.paid, 0);
  const due = Math.max(0, ws.campaigns.reduce((n, c) => n + c.payable, 0) - paid);
  const cost = cpm(earned, views);
  const best = topPosts(ws.posts, 3);
  const people = new Set(ws.creators.map((c) => c.applicantId)).size;

  return (
    <PageShell>
      <PageHeader title={brand.companyName} actions={newCampaign} />

      <StatGrid>
        <Stat label="Total views" value={views.toLocaleString()} />
        <Stat label="Videos" value={counted.length.toLocaleString()} hint={`${people} ${people === 1 ? "creator" : "creators"}`} />
        <Stat label="Earned by creators" value={formatCurrency(earned)} hint={cost === null ? "No views yet" : `${formatCurrency(cost)} per 1,000 views`} />
        <Stat label="Still to pay" value={formatCurrency(due)} attention={due > 0} hint={`${formatCurrency(paid)} paid so far`} />
      </StatGrid>

      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Your campaigns</h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-border/70 bg-card">
        <table className="w-full min-w-0 text-left text-sm">
          <thead className="border-b border-border/70 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">To do</th>
              <th className="hidden px-3 py-3 text-right font-medium md:table-cell">Creators</th>
              <th className="hidden px-3 py-3 text-right font-medium md:table-cell">Videos</th>
              <th className="px-3 py-3 text-right font-medium">Views</th>
              <th className="hidden px-3 py-3 text-right font-medium md:table-cell">Earned</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {ws.campaigns.map((c) => {
              const toApprove = c.reviewer === "brand" ? c.awaitingReview : 0;
              const toPay = Math.max(0, c.payable - c.paid);
              return (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/brand/campaigns/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {label(c.platform)} · Started {formatDate(c.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    {toApprove === 0 && toPay <= 0 ? (
                      <span className="text-xs text-muted-foreground">All done</span>
                    ) : (
                      <ul className="flex flex-col gap-0.5 text-xs font-semibold">
                        {toApprove > 0 && (
                          <li>
                            <Link href="/brand/approvals" className="text-primary hover:underline">
                              {toApprove} {toApprove === 1 ? "video" : "videos"} to approve
                            </Link>
                          </li>
                        )}
                        {toPay > 0 && (
                          <li>
                            <Link href="/brand/payments" className="text-primary hover:underline">
                              {formatCurrency(toPay)} to pay
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">{c.creators.length}</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">{c.postsCounted}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.views.toLocaleString()}</td>
                  <td className="hidden px-3 py-3 text-right tabular-nums md:table-cell">{formatCurrency(c.earned)}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/brand/campaigns/${c.id}`} aria-label={`Open ${c.title}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {best.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Best videos</h2>
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {best.map((p, i) => (
              <li key={p.id} className="flex flex-col rounded-xl border border-border/70 bg-card p-3.5 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                  <span>#{i + 1}</span>
                  <span>{label(p.platform)}</span>
                </div>
                <p className="mt-2 font-heading text-xl font-semibold tabular-nums text-foreground sm:mt-3 sm:text-2xl">
                  {p.views.toLocaleString()}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">views</span>
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">{p.creatorName}</p>
                <p className="text-sm text-muted-foreground">{p.campaignTitle}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full sm:mt-4"
                  nativeButton={false}
                  render={<a href={p.url} target="_blank" rel="noopener noreferrer" />}
                >
                  Watch video
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-sm text-muted-foreground">Views are read from each platform about once a day.</p>
    </PageShell>
  );
}
