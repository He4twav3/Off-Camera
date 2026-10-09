import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrandShell } from "./BrandShell";
import { createClient } from "@/lib/supabase/server";
import { loadBrandWorkspace } from "@/lib/brand-workspace";

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

  return (
    <BrandShell company={brand.company_name} approvals={approvals}>
      {children}
    </BrandShell>
  );
}
