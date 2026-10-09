import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrandShell } from "./BrandShell";
import { createClient } from "@/lib/supabase/server";
import { loadBrandWorkspace } from "@/lib/brand-workspace";
import { contractSections, contractStatus } from "@/lib/contract";
import { pendingContracts } from "./_brand";
import { ContractCard } from "./ContractCard";
import { ContractModal } from "./ContractModal";

/**
 * The brand side's own shell — separate from the creator/course dashboard,
 * which has course navigation brands have no use for. Signed-in only (the
 * proxy covers /brand); anyone without a brand account goes to the normal
 * dashboard.
 */
export default async function BrandLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/brand");

  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, company_name, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");

  // The number beside Approvals: videos this brand has chosen to approve itself and hasn't yet.
  const ws = brand.status === "approved" ? await loadBrandWorkspace(brand.id) : null;
  const approvals = (ws?.campaigns ?? []).reduce((n, c) => n + (c.reviewer === "brand" ? c.awaitingReview : 0), 0);

  // The contract comes first. Until it is agreed for every campaign it pops up over the screen, and the page
  // behind it is not rendered at all.
  const pending = ws ? pendingContracts(ws) : [];
  if (pending.length > 0)
    return (
      <BrandShell company={brand.company_name} approvals={0}>
        <ContractModal>
          <div className="flex flex-col gap-3">
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
        </ContractModal>
      </BrandShell>
    );

  return (
    <BrandShell company={brand.company_name} approvals={approvals}>
      {children}
    </BrandShell>
  );
}
