import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { CampaignActions } from "./CampaignActions";

export const metadata: Metadata = { title: "Campaign signups · Admin" };

// Approving counts views right away, which calls YouTube/Apify and can take a
// while. Applies to the server action invoked from this page.
export const maxDuration = 60;

export default async function AdminCampaignsPage() {
  const supabase = await createClient();
  const [{ data: signups }, { data: views }] = await Promise.all([
    supabase.from("campaign_signups").select("*").order("created_at", { ascending: false }),
    supabase.from("campaign_views").select("campaign, platform, handle, views"),
  ]);

  const viewsFor = (campaign: string, handles: string[]) =>
    (views ?? [])
      .filter((v) => v.campaign === campaign && handles.includes(v.handle))
      .reduce((n, v) => n + v.views, 0);

  const pending = signups?.filter((s) => s.status === "pending") ?? [];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Campaign signups
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {pending.length} awaiting review · {signups?.length ?? 0} total. Approving counts
          views immediately; they refresh daily after that.
        </p>
      </header>

      {!signups || signups.length === 0 ? (
        <Card className="border-border/70 py-12 text-center">
          <CardContent>
            <h2 className="font-heading text-xl font-semibold text-foreground">No signups yet</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              They show up here when someone submits /campaign.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {signups.map((s) => {
            const handles = [s.instagram_handle, s.tiktok_handle, s.youtube_handle]
              .map((h) => h.replace(/^@+/, "").toLowerCase())
              .filter(Boolean);
            return (
              <li key={s.id}>
                <Card className="border-border/70">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1 text-[15px]">
                      <p className="font-semibold text-foreground">
                        {s.creator_name}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {s.campaign || "No campaign"} · {s.status}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {[
                          s.instagram_handle && `IG @${s.instagram_handle}`,
                          s.tiktok_handle && `TikTok @${s.tiktok_handle}`,
                          s.youtube_handle && `YouTube @${s.youtube_handle}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {s.post_links && (
                        <p className="break-all text-sm text-muted-foreground">
                          {s.post_links.split(/\s+/).join(" · ")}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Signed up {formatDate(s.created_at)}
                        {s.status === "approved" && (
                          <>
                            {" "}
                            · {viewsFor(s.campaign, handles).toLocaleString()} views
                            {s.last_counted_at && ` (counted ${formatDate(s.last_counted_at)})`}
                          </>
                        )}
                      </p>
                      {s.count_error && (
                        <p className="text-sm font-medium text-destructive">
                          Last count: {s.count_error}
                        </p>
                      )}
                    </div>
                    <CampaignActions id={s.id} status={s.status} name={s.creator_name} />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
