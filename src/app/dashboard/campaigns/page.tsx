import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_RULES } from "@/lib/handles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Campaign views",
  robots: { index: false, follow: false },
};

/**
 * A creator's campaign view counts. Reads through the normal server client,
 * so RLS (campaign_views_select_own) limits rows to handles on this user's
 * own profile — no extra filtering needed here.
 */
export default async function CampaignViewsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("campaign_views")
    .select("id, campaign, platform, handle, views, updated_at")
    .order("campaign")
    .order("platform");

  const total = (rows ?? []).reduce((sum, r) => sum + r.views, 0);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Campaign views
      </h1>
      <p className="mt-1.5 text-muted-foreground">
        Views on the posts you submitted for each campaign. Counts refresh
        after your submission is approved.
      </p>

      {!rows || rows.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No campaign views yet. Once your signup is approved and your posts
            are counted, they&apos;ll show up here.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mt-6 text-sm font-medium">
            Total: {total.toLocaleString()} views
          </p>
          <ul className="mt-3 space-y-3">
            {rows.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {r.campaign || "General"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {PLATFORM_RULES[r.platform].label} · @{r.handle}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-semibold tabular-nums">
                      {r.views.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
