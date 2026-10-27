import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignView } from "@/components/app/CampaignView";
import { readCampaignGuide } from "@/lib/campaign-guide-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePayoutTerms } from "@/lib/payout-terms";
import { parsePostTerms } from "@/lib/post-terms";
import { ensureCampaignPreset } from "@/lib/apply-campaign-presets";
import { campaignHold } from "@/lib/campaign-holds";

/**
 * The campaign exactly as a creator sees it, read-only (the Apply button is switched off), with Edit on the bar above
 * it. Used on the brand's home page. The campaign must be the brand's own: the service role reads it only after
 * matching the brand id.
 */
export async function CreatorView({ jobId, brandId }: { jobId: string; brandId: string }) {
  await ensureCampaignPreset(jobId);
  const { data: job } = await createAdminClient()
    .from("jobs")
    .select("*, niches(label)")
    .eq("id", jobId)
    .eq("brand_account_id", brandId)
    .maybeSingle();
  if (!job) notFound();
  const postTerms = parsePostTerms(job.post_terms);
  const hold = job.status === "open" ? campaignHold(job) : null;
  const guide = await readCampaignGuide(job);

  return (
    <section aria-label="How creators see your campaign" className="overflow-hidden rounded-xl border border-border/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/30 bg-primary/10 px-4 py-2">
        <p className="text-sm font-semibold text-foreground">How creators see it</p>
        <Button size="sm" nativeButton={false} render={<Link href={`/brand/campaigns/${jobId}/edit`} />}>
          <Pencil className="size-3.5" />
          Edit campaign
        </Button>
      </div>
      <CampaignView
        job={job}
        terms={parsePayoutTerms(job.payout_terms)}
        postTerms={postTerms}
        guide={guide}
        // A held campaign (lib/campaign-holds.ts) shows its reason in place of Apply, as creators see it.
        intro={hold ? hold.note : postTerms ? "Apply to get started: you can add posts as soon as you're on." : "Apply to get started."}
        cta={
          <Button size="lg" className="w-full" disabled>
            {hold ? hold.label : "Apply to this campaign"}
          </Button>
        }
        back={null}
        emptyExamplesHref={`/brand/campaigns/${jobId}/edit`}
      />
    </section>
  );
}
