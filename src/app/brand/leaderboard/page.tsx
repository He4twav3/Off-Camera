import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { EmptyState, PageHeader, PageShell } from "@/components/kit/ui";
import { leaderboard } from "@/lib/brand-stats";
import { cn, formatCurrency } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function BrandLeaderboardPage(props: { searchParams: Promise<{ campaign?: string }> }) {
  const { campaign } = await props.searchParams;
  const { brand, ws, approved } = await loadBrandPage("/brand/leaderboard");
  const chosen = ws.campaigns.find((c) => c.id === campaign) ?? null;
  const creators = (chosen ? chosen.creators : ws.creators).map((c) => ({
    applicantId: c.applicantId,
    name: c.name,
    handle: c.handle,
    posts: c.posts.map((p) => ({ id: p.id, platform: p.platform, views: p.views, counted: p.counted, earned: p.earned })),
  }));
  const rows = leaderboard(creators);
  // A creator's page is per campaign: the chosen one, or their biggest when showing all.
  const openOf = (applicantId: string) => {
    const mine = (chosen ? chosen.creators : ws.creators)
      .filter((c) => c.applicantId === applicantId)
      .sort((a, b) => b.views - a.views)[0];
    return mine ? `/brand/creators/${mine.assignmentId}` : "/brand/creators";
  };

  return (
    <PageShell>
      <PageHeader title="Leaderboard" summary={chosen ? chosen.title : "All your campaigns"} />
      {!approved ? (
        <PendingNotice status={brand.status} />
      ) : (
        <>
          {ws.campaigns.length > 1 && (
            <nav aria-label="Campaign" className="mb-5 flex flex-wrap gap-2">
              {[{ id: "", title: "All campaigns" }, ...ws.campaigns].map((c) => {
                const on = (chosen?.id ?? "") === c.id;
                return (
                  <Link
                    key={c.id || "all"}
                    href={c.id ? `/brand/leaderboard?campaign=${c.id}` : "/brand/leaderboard"}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium",
                      on ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.title}
                  </Link>
                );
              })}
            </nav>
          )}
          {rows.length === 0 ? (
            <EmptyState title="No results yet" body="Creators are ranked by the views on their approved, counting videos." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="border-b border-border/70 text-xs text-muted-foreground">
                  <tr>
                    <th className="w-14 px-4 py-3 font-medium">#</th>
                    <th className="px-3 py-3 font-medium">Creator</th>
                    <th className="px-3 py-3 text-right font-medium">Videos</th>
                    <th className="px-3 py-3 text-right font-medium">Views</th>
                    <th className="px-3 py-3 text-right font-medium">Best video</th>
                    <th className="px-3 py-3 text-right font-medium">Average</th>
                    <th className="px-3 py-3 text-right font-medium">Earned</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {rows.map((r) => (
                    <tr key={r.applicantId} className={r.rank <= 3 ? "bg-primary/5" : undefined}>
                      <td className="px-4 py-3 font-heading font-semibold tabular-nums">
                        {r.rank === 1 ? <Trophy className="size-4 text-amber-400" aria-label="First" /> : r.rank}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={openOf(r.applicantId)} className="font-medium text-foreground hover:underline">
                          {r.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">@{r.handle}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.posts}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{r.views.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.bestPost.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{r.avgViews.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(r.earned)}</td>
                      <td className="px-3 py-3 text-right">
                        <Link href={openOf(r.applicantId)} aria-label={`Open ${r.name}`}>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
