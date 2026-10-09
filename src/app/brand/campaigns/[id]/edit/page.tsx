import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { PLATFORM_LABELS } from "@/lib/utils";
import { postTermsChips, parsePostTerms } from "@/lib/post-terms";
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
        {terms && (
          <section className="mt-5 rounded-xl border border-border/70 bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Pay terms</h2>
            <p className="mt-2 flex flex-wrap gap-2">
              {postTermsChips(terms).map((chip) => (
                <span key={chip} className="rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {chip}
                </span>
              ))}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Pay terms can&apos;t be changed here, because a change would alter what is owed on videos already
              made. To change them, get in touch with OnCamera.
            </p>
          </section>
        )}
      </div>
    </PageShell>
  );
}
