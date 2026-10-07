import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BrandShell } from "./BrandShell";
import { createClient } from "@/lib/supabase/server";

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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");

  return <BrandShell>{children}</BrandShell>;
}
