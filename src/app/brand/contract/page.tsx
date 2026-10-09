import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "@/components/kit/ui";
import { loadBrandWorkspace } from "@/lib/brand-workspace";
import { contractSections, contractStatus } from "@/lib/contract";
import { requireBrand, pendingContracts } from "../_brand";
import { PendingNotice } from "../PendingNotice";
import { ContractCard } from "../ContractCard";

export const metadata: Metadata = { title: "Contract" };

/** The first thing a brand does: agree to the contract for each campaign. Nothing else opens until it's done. */
export default async function BrandContractPage() {
  const brand = await requireBrand("/brand/contract");
  if (brand.status !== "approved")
    return (
      <PageShell>
        <PendingNotice status={brand.status} />
      </PageShell>
    );
  const ws = await loadBrandWorkspace(brand.id);
  const pending = pendingContracts(ws);
  if (pending.length === 0) redirect("/brand");

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Sign your contract"
          summary="This comes first. Fill in your company details and agree. The rest of your account opens as soon as it is saved."
        />
        {pending.map((c) => (
          <div key={c.id}>
            <p className="mb-2 font-heading text-sm font-semibold text-foreground">{c.title}</p>
            <ContractCard
              jobId={c.id}
              status={contractStatus(c.terms!)}
              contract={c.terms!.contract ?? null}
              sections={contractSections({ campaign: c.title, agency: "OnCamera", terms: c.terms!, brand: c.terms!.contract })}
              wordHref={`/brand/campaigns/${c.id}/contract/word`}
            />
          </div>
        ))}
      </div>
    </PageShell>
  );
}
