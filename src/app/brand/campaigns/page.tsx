import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, PageHeader, PageShell } from "@/components/kit/ui";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";
import { loadBrandPage } from "../_brand";
import { PendingNotice } from "../PendingNotice";

export const metadata: Metadata = { title: "Campaigns" };

const STATUS = {
  open: { label: "Open", tone: "open" as const },
  filled: { label: "Filled", tone: "closed" as const },
  closed: { label: "Closed", tone: "closed" as const },
};

export default async function BrandCampaignsPage() {
  const { brand, ws, approved } = await loadBrandPage("/brand/campaigns");
  return (
    <PageShell>
      <PageHeader
        title="Campaigns"
        actions={
          approved && (
            <Button nativeButton={false} render={<Link href="/brand/campaigns/new" />}>
              <Plus className="size-4" />
              New campaign
            </Button>
          )
        }
      />
      {!approved ? (
        <PendingNotice status={brand.status} />
      ) : ws.campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" body="Post your first campaign and creators can join straight away." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border/70 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Creators</th>
                <th className="px-3 py-3 text-right font-medium">Videos</th>
                <th className="px-3 py-3 text-right font-medium">Views</th>
                <th className="px-3 py-3 text-right font-medium">Earned</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {ws.campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/brand/campaigns/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.title}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform} · Started {formatDate(c.createdAt)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</StatusBadge>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.creators.length}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.postsCounted}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.views.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(c.earned)}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/brand/campaigns/${c.id}`} aria-label={`Open ${c.title}`}>
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
