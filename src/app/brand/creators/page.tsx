import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader, PageShell } from "@/components/kit/ui";
import { formatCurrency } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";

export const metadata: Metadata = { title: "Creators" };

export default async function BrandCreatorsPage() {
  const { brand, ws, approved } = await loadBrandPage("/brand/creators");
  const rows = [...ws.creators].sort((a, b) => b.views - a.views);
  return (
    <PageShell>
      <PageHeader title="Creators" summary="Everyone working on your campaigns, ranked by views." />
      {!approved ? (
        <PendingNotice status={brand.status} />
      ) : rows.length === 0 ? (
        <EmptyState title="No creators yet" body="Creators who join your campaigns appear here with their videos and earnings." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border/70 text-xs text-muted-foreground">
              <tr>
                <th className="w-12 px-4 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Creator</th>
                <th className="px-3 py-3 font-medium">Campaign</th>
                <th className="px-3 py-3 text-right font-medium">Videos</th>
                <th className="px-3 py-3 text-right font-medium">Views</th>
                <th className="px-3 py-3 text-right font-medium">Earned</th>
                <th className="px-3 py-3 text-right font-medium">Paid</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rows.map((c, i) => (
                <tr key={c.assignmentId} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-heading font-semibold tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-3">
                    <Link href={`/brand/creators/${c.assignmentId}`} className="font-medium text-foreground hover:underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">@{c.handle}</span>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{c.campaignTitle}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.postsCounted}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.views.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(c.earned)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(c.paid)}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/brand/creators/${c.assignmentId}`} aria-label={`Open ${c.name}`}>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
