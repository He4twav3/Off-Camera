import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDirectPay } from "@/lib/direct-pay";
import { adminNavGroups } from "@/lib/admin-nav";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { adminBadges } from "@/lib/admin-badges";

// Admin is never indexed, cached or shared; the security headers for it are in
// next.config.ts and /admin is disallowed in robots.ts.
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  // Second gate behind the middleware check — same is_admin() allowlist that
  // backs the RLS policies, so a direct request can't slip past.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  // To anyone who is not an admin this place does not exist.
  if (!isAdmin) notFound();

  // The numbers beside the menu items: what is waiting on you, page by page.
  const badges = await adminBadges(await getAdminWorkspace());

  return (
    <AdminShell groups={adminNavGroups(isDirectPay(), badges.empty)} email={user.email ?? ""} badges={badges.counts}>
      {children}
    </AdminShell>
  );
}
