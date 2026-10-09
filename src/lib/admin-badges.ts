import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSent } from "@/lib/admin-payments";
import { campaignTasks } from "@/lib/admin-tasks";
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

  // The numbers are the sum of each campaign's own to-do (lib/admin-tasks.ts), so the menu and the campaigns agree.
  const { sent } = await getSent();
  const tasks = ws.campaigns.flatMap((c) => campaignTasks(c, new Set(sent.keys())));
  const sum = (...kinds: string[]) => tasks.filter((t) => kinds.includes(t.kind)).reduce((n, t) => n + t.count, 0);

  return {
    counts: {
      "/admin/brands": n(brands),
      "/admin/applicants": n(creators),
      "/admin/applications": n(apps),
      "/admin/campaigns": n(signups),
      "/admin/review": sum("review"),
      "/admin/statements": sum("statement", "chase"),
      "/admin/payout-details": sum("email"),
    },
    what: {
      "/admin/brands": "brands to approve or reject",
      "/admin/applicants": "creators to approve or reject",
      "/admin/applications": "applications to decide",
      "/admin/campaigns": "sign-ups to review",
      "/admin/review": "videos waiting for your approval",
      "/admin/statements": "payments to issue or chase",
      "/admin/payout-details": "payment emails to send",
    },
    empty: [
      ...(n(appsAll) === 0 ? ["/admin/applications"] : []),
      ...(n(signupsAll) === 0 ? ["/admin/campaigns"] : []),
    ],
  };
}
