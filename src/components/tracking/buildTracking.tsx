import type { ReactNode } from "react";
import type { PlatformEnum } from "@/lib/database.types";
import { payFor, type PostRowData, type PostTerms } from "@/lib/post-terms";
import { ContractDetails } from "@/components/tracking/ContractDetails";
import { EarningsPanel } from "@/components/tracking/EarningsPanel";
import { PostsPanel } from "@/components/tracking/PostsPanel";
import { TrackingHeader } from "@/components/tracking/TrackingHeader";
import {
  TrackingTabs,
  type TrackingTab,
} from "@/components/tracking/TrackingTabs";

export type Tracking = {
  tab: TrackingTab;
  header: ReactNode;
  tabs: ReactNode;
  /** What the Earnings and Posts tabs show. */
  panel: ReactNode;
  /** Added to the Overview tab, above the brief. */
  overviewExtra: ReactNode;
};

/**
 * Everything the tracking view of a joined campaign is made of, from one set of posts.
 * The creator and the brand are shown the same pieces, so the numbers always agree.
 */
export function buildTracking(p: {
  terms: PostTerms;
  posts: PostRowData[];
  paidTotal: number;
  tab: TrackingTab;
  sort: "recent" | "views";
  basePath: string;
  startedAt: string;
  handles: { platform: PlatformEnum; handle: string }[];
  viewer?: "creator" | "brand";
  now?: Date;
}): Tracking {
  const now = p.now ?? new Date();
  const viewer = p.viewer ?? "creator";
  const pay = payFor(p.terms, p.posts, now);
  return {
    tab: p.tab,
    header: (
      <TrackingHeader
        terms={p.terms}
        pay={pay}
        paidTotal={p.paidTotal}
        viewer={viewer}
      />
    ),
    tabs: <TrackingTabs active={p.tab} basePath={p.basePath} />,
    panel:
      p.tab === "earnings" ? (
        <EarningsPanel
          terms={p.terms}
          posts={p.posts}
          paidTotal={p.paidTotal}
          viewer={viewer}
          now={now}
        />
      ) : p.tab === "posts" ? (
        <PostsPanel
          terms={p.terms}
          posts={p.posts}
          sort={p.sort}
          basePath={p.basePath}
          viewer={viewer}
          now={now}
        />
      ) : null,
    overviewExtra: (
      <ContractDetails
        terms={p.terms}
        posts={p.posts}
        startedAt={p.startedAt}
        handles={p.handles}
        now={now}
      />
    ),
  };
}
