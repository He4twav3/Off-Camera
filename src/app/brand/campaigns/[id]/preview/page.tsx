import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignView } from "@/components/app/CampaignView";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePayoutTerms } from "@/lib/payout-terms";
import { parsePostTerms } from "@/lib/post-terms";
import { loadBrandPage } from "../../../_brand";
import { PendingNotice } from "../../../PendingNotice";
import { PageShell } from "@/components/kit/ui";

export const metadata: Metadata = { title: "How creators see it" };

/**
 * The campaign exactly as a creator sees it, with the button inside the page that takes the brand to Edit.
 * Read-only: nothing here can be submitted. The campaign must be this brand's own.
 */
export default async function BrandCampaignPreviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { brand, ws, approved } = await loadBrandPage(`/brand/campaigns/${id}/preview`);
  if (!approved)
    return (
      <PageShell>
        <PendingNotice status={brand.status} />
      </PageShell>
    );
  if (!ws.campaigns.some((c) => c.id === id)) notFound();

  const { data: job } = await createAdminClient()
    .from("jobs")
    .select("*, niches(label)")
    .eq("id", id)
    .eq("brand_account_id", brand.id)
    .maybeSingle();
  if (!job) notFound();
  const postTerms = parsePostTerms(job.post_terms);

  return (
    <>
      <div className="sticky top-14 z-30 border-b border-primary/30 bg-primary/10 backdrop-blur lg:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <p className="text-sm font-semibold text-foreground">
            This is how creators see your campaign.
            <span className="ml-1 font-normal text-muted-foreground">Nothing here can be submitted.</span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" nativeButton={false} render={<Link href={`/brand/campaigns/${id}/edit`} />}>
              <Pencil className="size-3.5" />
              Edit campaign
            </Button>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/brand/campaigns/${id}`} />}>
              Back
            </Button>
          </div>
        </div>
      </div>
      <CampaignView
        job={job}
        terms={parsePayoutTerms(job.payout_terms)}
        postTerms={postTerms}
        intro={postTerms ? "Apply to get started: you can add posts as soon as you're on." : "Apply to get started."}
        cta={
          <Button size="lg" className="w-full" disabled>
            Apply to this campaign
          </Button>
        }
        back={{ href: `/brand/campaigns/${id}`, label: "← Your campaign" }}
      />
    </>
  );
}
