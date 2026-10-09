import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminWorkspace } from "@/lib/admin-workspace";

/**
 * The numbers on the admin menu: for each page, how many things are waiting on you. This is how
 * nothing gets left undone: look down the menu, and anything with a number needs doing.
 * Keyed by the menu item's address. Also says which older pages have nothing at all, so the menu
 * can leave them out.
 */
export type AdminBadges = { counts: Record<string, number>; empty: string[] };

export async function adminBadges(ws: AdminWorkspace): Promise<AdminBadges> {
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const [brands, creators, apps, appsAll, signups, signupsAll] = await Promise.all([
    supabase.from("brand_accounts").select("*", head).eq("status", "pending"),
    supabase.from("applicants").select("*", head).eq("status", "pending"),
    supabase.from("applications").select("*", head).eq("status", "pending"),
    supabase.from("applications").select("*", head),
    supabase.from("campaign_signups").select("*", head).eq("status", "pending"),
    supabase.from("campaign_signups").select("*", head),
  ]);
  const n = (r: { count: number | null }) => r.count ?? 0;

  const inReview = ws.campaigns
    .filter((c) => c.terms?.reviewer === "oncamera")
    .reduce((sum, c) => sum + c.awaitingReview, 0);
  const statements = ws.creators.flatMap((c) => c.statements);
  const ready = ws.creators.filter((c) =>
    c.statements.length === 0 ? c.status === "submitted" || c.payable >= 0.01 : c.payable - c.statemented >= 0.01,
  ).length;
  const attention = statements.filter((s) => s.state === "overdue" || s.state === "disputed").length;
  const feesOpen = statements.filter((s) => s.ourFee > 0 && !s.feeReceived).length;
  const noBrand = ws.campaigns.filter((c) => c.status === "open" && !c.brandId).length;

  return {
    counts: {
      "/admin/brands": n(brands),
      "/admin": noBrand,
      "/admin/applicants": n(creators),
      "/admin/applications": n(apps),
      "/admin/campaigns": n(signups),
      "/admin/review": inReview,
      "/admin/statements": ready + attention,
      "/admin/fees": feesOpen,
    },
    empty: [
      ...(n(appsAll) === 0 ? ["/admin/applications"] : []),
      ...(n(signupsAll) === 0 ? ["/admin/campaigns"] : []),
    ],
  };
}
