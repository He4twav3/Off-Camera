// TEMPORARY. Never committed. What a brand sees for one creator on the Getimg campaign.
import Link from "next/link";
import { DenyPostForm } from "@/app/brand/DenyPostForm";
import { CreatorShell } from "../_shell";
import { PageShell } from "@/components/kit/ui";
import { buildTracking } from "@/components/tracking/buildTracking";
import { parseTab } from "@/components/tracking/TrackingTabs";
import { GETIMG_TERMS } from "@/lib/post-terms";
import { getimgPosts } from "../_getimg";

export default async function Page(props: { searchParams: Promise<{ tab?: string; sort?: string }> }) {
  const { tab, sort } = await props.searchParams;
  const t = buildTracking({
    terms: GETIMG_TERMS, posts: getimgPosts, paidTotal: 150, tab: parseTab(tab), sort: sort === "views" ? "views" : "recent",
    basePath: "/preview/brand-getimg", startedAt: new Date(Date.now() - 80 * 86400000).toISOString(),
    handles: [{ platform: "tiktok", handle: "maya" }, { platform: "instagram", handle: "maya.rivers" }], viewer: "brand", postAction: (post) => <DenyPostForm postId={post.id} />,
  });
  return (
    <CreatorShell>
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <Link href="/preview/brand" className="text-sm text-muted-foreground hover:text-foreground">← Campaigns</Link>
          <h1 className="mt-3 font-heading text-xl font-semibold text-foreground sm:text-2xl">Maya Rivers</h1>
          <p className="mt-1 text-sm text-muted-foreground">@maya · Getimg</p>
          {t.header}
          {t.tabs}
          {t.tab === "overview" ? t.overviewExtra : t.panel}
        </div>
      </PageShell>
    </CreatorShell>
  );
}
