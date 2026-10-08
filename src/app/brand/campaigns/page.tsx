import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PageShell, Row, RowList } from "@/components/kit/ui";
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
        <RowList>
          {ws.campaigns.map((c) => (
            <Row
              key={c.id}
              title={
                <Link href={`/brand/campaigns/${c.id}`} className="hover:underline">
                  {c.title}
                </Link>
              }
              meta={`${PLATFORM_LABELS[c.platform as keyof typeof PLATFORM_LABELS] ?? c.platform} · Started ${formatDate(c.createdAt)} · ${c.creators.length} ${c.creators.length === 1 ? "creator" : "creators"} · ${c.postsCounted} ${c.postsCounted === 1 ? "video" : "videos"}`}
              status={STATUS[c.status].label}
              statusTone={STATUS[c.status].tone}
              figure={c.views.toLocaleString()}
              figureLabel="Views"
              figureNote={`${formatCurrency(c.earned)} earned`}
            />
          ))}
        </RowList>
      )}
    </PageShell>
  );
}
