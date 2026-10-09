import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { PLATFORM_LABELS } from "@/lib/utils";
import { parsePostTerms } from "@/lib/post-terms";
import { requireBrand } from "../../../_brand";
import { PendingNotice } from "../../../PendingNotice";
import { EditCampaignForm } from "./EditCampaignForm";
import { CampaignLogoForm } from "../../../CampaignLogoForm";
import { CampaignStatusButton } from "../../../CampaignStatusButton";

export const metadata: Metadata = { title: "Edit campaign" };

export default async function EditCampaignPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const brand = await requireBrand(`/brand/campaigns/${id}/edit`);
  if (brand.status !== "approved")
    return (
      <PageShell>
        <PendingNotice status={brand.status} />
      </PageShell>
    );

  // Only the brand's own campaign (the service role is used after matching the brand id).
  const { data: job } = await createAdminClient()
    .from("jobs")
    .select("id, title, platform, niche_id, about, description, formats, example_urls, post_terms, logo_url, status")
    .eq("id", id)
    .eq("brand_account_id", brand.id)
    .maybeSingle();
  if (!job) notFound();
  const supabase = await createClient();
  const { data: niches } = await supabase.from("niches").select("id, label").eq("is_active", true).order("label");
  const terms = parsePostTerms(job.post_terms);
  const { count: joined } = await createAdminClient().from("assignments").select("id", { count: "exact", head: true }).eq("job_id", job.id);
  const hasCreators = (joined ?? 0) > 0;

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Link href={`/brand?c=${job.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {job.title}
        </Link>
        <div className="mt-3">
          <PageHeader title="Edit campaign" summary="Changes show to creators straight away." />
        </div>
        <EditCampaignForm
          campaign={{
            id: job.id,
            title: job.title,
            nicheId: job.niche_id,
            about: job.about ?? "",
            rules: job.description,
            formats: job.formats ?? "",
            examples: (job.example_urls ?? []).join("\n"),
            platforms: (terms?.platforms ?? [job.platform]).map((p) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p),
            platformValues: terms?.platforms ?? [job.platform],
            pay: terms,
            hasCreators,
            requirements: terms?.requirements,
          }}
          niches={niches ?? []}
        />
        <section className="mt-5 flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Logo and status</h2>
          <CampaignLogoForm jobId={job.id} logoUrl={job.logo_url} />
          <div>
            <CampaignStatusButton jobId={job.id} status={job.status} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
