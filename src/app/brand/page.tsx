import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell, Stat, StatGrid } from "@/components/kit/ui";
import { cpm, topPosts } from "@/lib/brand-stats";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { loadBrandPage } from "./_brand";
import { NewCampaignForm } from "./campaigns/new/NewCampaignForm";
import { PendingNotice } from "./PendingNotice";
import { BestVideos } from "./BestVideos";
import { ReviewerChoice } from "./ReviewerChoice";
import { CreatorView } from "./CreatorView";

export const metadata: Metadata = { title: "Campaigns" };

/**
 * The brand's one main page: the totals in a single strip, who approves the videos, and the campaign exactly as
 * creators see it, with Edit on it. A brand with several campaigns picks one at the top.
 */
export default async function BrandHomePage(props: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await props.searchParams;
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

  // No campaign yet: the page is the empty form itself, so there is nothing to click through to.
  if (ws.campaigns.length === 0) {
    const { data: niches } = await (await createClient()).from("niches").select("id, label").eq("is_active", true).order("label");
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <PageHeader
            title="Create your first campaign"
            summary="Fill this in and post it. Creators can join as soon as it is live, and you can change it any time."
          />
          <NewCampaignForm niches={niches ?? []} />
        </div>
      </PageShell>
    );
  }

  const chosen = ws.campaigns.find((x) => x.id === c) ?? ws.campaigns[0];
  const counted = ws.posts.filter((p) => p.counted);
  const views = counted.reduce((n, p) => n + p.views, 0);
  const earned = ws.campaigns.reduce((n, x) => n + x.earned, 0);
  const paid = ws.campaigns.reduce((n, x) => n + x.paid, 0);
  const due = Math.max(0, ws.campaigns.reduce((n, x) => n + x.payable, 0) - paid);
  const cost = cpm(earned, views);
  const people = new Set(ws.creators.map((x) => x.applicantId)).size;
  const waiting = chosen.reviewer === "brand" ? chosen.posts.filter((p) => p.counted && p.reviewed === false).length : 0;

  return (
    <PageShell>
      <PageHeader title={brand.companyName} actions={newCampaign} />

      <StatGrid>
        <Stat label="Total views" value={views.toLocaleString()} />
        <Stat label="Videos" value={counted.length.toLocaleString()} hint={`${people} ${people === 1 ? "creator" : "creators"}`} />
        <Stat label="Earned by creators" value={formatCurrency(earned)} hint={cost === null ? "No views yet" : `${formatCurrency(cost)} per 1,000 views`} />
        <Stat label="Still to pay" value={formatCurrency(due)} attention={due > 0} hint={`${formatCurrency(paid)} paid so far`} />
      </StatGrid>

      {ws.campaigns.length > 1 && (
        <nav aria-label="Campaign" className="mb-4 flex flex-wrap gap-2">
          {ws.campaigns.map((x) => (
            <Link
              key={x.id}
              href={`/brand?c=${x.id}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm font-medium",
                x.id === chosen.id ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/70 text-muted-foreground hover:text-foreground",
              )}
            >
              {x.title}
            </Link>
          ))}
        </nav>
      )}

      {chosen.reviewer && (
        <section className="mb-6 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <ReviewerChoice jobId={chosen.id} reviewer={chosen.reviewer} />
          {chosen.reviewer === "brand" && (
            <p className="mt-3 text-sm">
              {waiting > 0 ? (
                <Link href="/brand/approvals" className="font-semibold text-primary hover:underline">
                  {waiting} {waiting === 1 ? "video is" : "videos are"} waiting for you → Approvals
                </Link>
              ) : (
                <span className="text-muted-foreground">Nothing waiting for you right now.</span>
              )}
            </p>
          )}
        </section>
      )}

      <div className="mb-8">
        <CreatorView jobId={chosen.id} brandId={brand.id} />
      </div>

      <BestVideos videos={topPosts(ws.posts, 3)} />
      <p className="mt-6 text-sm text-muted-foreground">Views are read from each platform about once a day.</p>
    </PageShell>
  );
}
