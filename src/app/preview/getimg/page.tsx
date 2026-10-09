// TEMPORARY. Never committed. The Getimg campaign as a creator sees it.
import Link from "next/link";
import { CreatorShell } from "../_shell";
import { Button } from "@/components/ui/button";
import { CampaignView } from "@/components/app/CampaignView";
import { SubmitPost } from "@/components/app/SubmitPost";
import { buildTracking } from "@/components/tracking/buildTracking";
import { parseTab } from "@/components/tracking/TrackingTabs";
import { GETIMG_TERMS } from "@/lib/post-terms";
import { getimgJob, getimgPosts } from "../_getimg";

export default async function Page(props: { searchParams: Promise<{ joined?: string; demo?: string; tab?: string; sort?: string; paid?: string }> }) {
  const { joined: joinedParam, demo, tab, sort, paid } = await props.searchParams;
  // Real state: not joined. ?joined=1 is joined with nothing posted yet. ?demo=1 adds made-up posts to show the tracking.
  const joined = Boolean(joinedParam || demo);
  const tracking = joined
    ? buildTracking({
        terms: GETIMG_TERMS,
        posts: demo ? getimgPosts : [],
        paidTotal: paid ? 300 : 0,
        tab: parseTab(tab),
        sort: sort === "views" ? "views" : "recent",
        basePath: "/preview/getimg",
        // Real state: you started today and have no accounts listed. The demo adds a past start and some handles.
        startedAt: new Date(Date.now() - (demo ? 80 : 0) * 24 * 60 * 60 * 1000).toISOString(),
        handles: demo
          ? [
              { platform: "tiktok", handle: "maya" },
              { platform: "instagram", handle: "maya.rivers" },
              { platform: "youtube_shorts", handle: "mayamakes" },
            ]
          : [],
      })
    : undefined;
  return (
    <CreatorShell>
      <CampaignView
        job={getimgJob}
        terms={null}
        postTerms={GETIMG_TERMS}
        
        intro={joined ? "You're on this campaign. Add each post as you publish it." : "Join to get the full brief and start posting."}
        cta={
          joined ? (
            <SubmitPost assignmentId="a1" />
          ) : (
            <Button size="lg" className="w-full" nativeButton={false} render={<Link href="/preview/getimg?joined=1" />}>
              Join campaign
            </Button>
          )
        }
      />
    </CreatorShell>
  );
}
