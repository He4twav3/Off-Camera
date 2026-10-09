import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBrandWorkspace, type WCampaign, type Workspace } from "@/lib/brand-workspace";
import { contractStatus } from "@/lib/contract";

export type CurrentBrand = {
  id: string;
  companyName: string;
  contactName: string;
  status: "pending" | "approved" | "rejected";
};

/** The signed-in brand (RLS: a brand can only read its own account row), or a redirect. */
export async function requireBrand(next: string): Promise<CurrentBrand> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${next}`);
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, company_name, contact_name, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");
  return {
    id: brand.id,
    companyName: brand.company_name,
    contactName: brand.contact_name,
    status: brand.status,
  };
}

/** Campaigns whose contract the brand still has to agree to (never agreed, or the pay terms changed since). */
export function pendingContracts(ws: Workspace): WCampaign[] {
  return ws.campaigns.filter((c) => c.terms && contractStatus(c.terms) !== "signed");
}

/**
 * The contract comes first: until the brand has agreed to the contract on every campaign, no brand page opens
 * except Settings (log out) and the contract itself.
 */
export async function requireContractsSigned(brand: CurrentBrand): Promise<void> {
  if (brand.status !== "approved") return;
  const ws = await loadBrandWorkspace(brand.id);
  if (pendingContracts(ws).length > 0) redirect("/brand/contract");
}

/** The brand and everything about its campaigns (empty until the account is approved). */
export async function loadBrandPage(next: string): Promise<{ brand: CurrentBrand; ws: Workspace; approved: boolean }> {
  const brand = await requireBrand(next);
  const approved = brand.status === "approved";
  const ws = approved
    ? await loadBrandWorkspace(brand.id)
    : { campaigns: [], creators: [], posts: [], reviewAvailable: false };
  if (approved && pendingContracts(ws).length > 0) redirect("/brand/contract");
  return { brand, ws, approved };
}
