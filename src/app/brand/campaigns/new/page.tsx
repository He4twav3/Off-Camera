import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { requireBrand, requireContractsSigned } from "../../_brand";
import { PendingNotice } from "../../PendingNotice";
import { NewCampaignForm } from "./NewCampaignForm";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const brand = await requireBrand("/brand/campaigns/new");
  await requireContractsSigned(brand);
  const supabase = await createClient();
  const { data: niches } = await supabase.from("niches").select("id, label").eq("is_active", true).order("label");
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Link href="/brand" className="text-sm text-muted-foreground hover:text-foreground">
          ← Campaigns
        </Link>
        <div className="mt-3">
          <PageHeader title="New campaign" summary="Set the brief and the pay. Creators can join as soon as you post it." />
        </div>
        {brand.status !== "approved" ? <PendingNotice status={brand.status} /> : <NewCampaignForm niches={niches ?? []} />}
      </div>
    </PageShell>
  );
}
