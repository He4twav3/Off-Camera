import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CampaignView } from "@/components/app/CampaignView";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { createClient } from "@/lib/supabase/server";
import { parsePayoutTerms } from "@/lib/payout-terms";
import { parsePostTerms } from "@/lib/post-terms";

export const metadata: Metadata = { title: "Creator view · Admin" };

/** The campaign exactly as a creator sees it, read-only. Runs as the signed-in admin, so the database's own rules apply. */
export default async function AdminCampaignPreviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminMfa(`/admin/jobs/${id}/preview`);
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*, niches(label)").eq("id", id).maybeSingle();
  if (!job) notFound();
  const postTerms = parsePostTerms(job.post_terms);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/30 bg-primary/10 px-4 py-2 sm:px-6">
        <p className="text-sm font-semibold text-foreground">How creators see it</p>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/admin/jobs/${id}`} />}>
          Back to campaign
        </Button>
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
        back={{ href: `/admin/jobs/${id}`, label: "← Campaign" }}
      />
    </>
  );
}
