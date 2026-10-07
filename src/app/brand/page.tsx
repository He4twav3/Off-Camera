import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrandCampaigns } from "@/lib/brand-data";
import { isDirectPay } from "@/lib/direct-pay";
import { getBrandStatements } from "@/lib/direct-pay-data";
import { BrandDashboardView } from "./BrandDashboardView";

export const metadata: Metadata = { title: "Your campaigns" };

export default async function BrandDashboardPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/brand");

  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, company_name, contact_name, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");

  const approved = brand.status === "approved";
  const [campaigns, statements] = await Promise.all([
    approved ? getBrandCampaigns(brand.id) : Promise.resolve([]),
    approved && isDirectPay() ? getBrandStatements(brand.id) : Promise.resolve([]),
  ]);

  return (
    <BrandDashboardView
      tab={tab}
      brand={{
        firstName: brand.contact_name.split(" ")[0],
        company: brand.company_name,
        status: brand.status,
        campaigns,
        statements,
      }}
    />
  );
}
