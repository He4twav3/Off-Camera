import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminWorkspace } from "@/lib/admin-workspace";

/**
 * The numbers on the admin menu: for each page, how many things are waiting on you. This is how
 * nothing gets left undone: look down the menu, and anything with a number needs doing.
 * Keyed by the menu item's address. Also says which older pages have nothing at all, so the menu
 * can leave them out.
 */
export type AdminBadges = { counts: Record<string, number>; what: Record<string, string>; empty: string[] };

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
  // Ready for a statement: something is actually due that is not on a statement yet. A campaign paid per
  // video works that out from the contract; an older one is ready once the creator has sent their post.
  const perPost = new Set(ws.campaigns.filter((c) => c.perPost).map((c) => c.id));
  const ready = ws.creators.filter((c) =>
    perPost.has(c.campaignId) ? c.payable - c.statemented >= 0.01 : c.status === "submitted" && c.statements.length === 0,
  ).length;
  const attention = statements.filter((s) => s.state === "overdue" || s.state === "disputed").length;
  const feesOpen = statements.filter((s) => s.ourFee > 0 && !s.feeReceived).length;

  return {
    counts: {
      "/admin/brands": n(brands),
      "/admin/applicants": n(creators),
      "/admin/applications": n(apps),
      "/admin/campaigns": n(signups),
      "/admin/review": inReview,
      "/admin/statements": ready + attention,
      "/admin/fees": feesOpen,
    },
    what: {
      "/admin/brands": "brands to approve or reject",
      "/admin/applicants": "creators to approve or reject",
      "/admin/applications": "applications to decide",
      "/admin/campaigns": "sign-ups to review",
      "/admin/review": "videos waiting for your approval",
      "/admin/statements": "statements to issue or chase",
      "/admin/fees": "fees not yet received",
    },
    empty: [
      ...(n(appsAll) === 0 ? ["/admin/applications"] : []),
      ...(n(signupsAll) === 0 ? ["/admin/campaigns"] : []),
    ],
  };
}
