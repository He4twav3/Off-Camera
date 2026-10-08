/**
 * Reading a post, and judging it. A reading is what the platform shows about one post:
 * its views, who posted it and when. The judgement is whether it counts for this
 * creator: it must be on one of THEIR OWN verified accounts, and published AFTER they
 * joined the campaign. Without that, anyone could submit someone else's viral video.
 *
 * Pure (no server imports) so it can be tested on sample data; the part that actually
 * calls YouTube and Apify is in post-reading-server.ts.
 */

export type PostReading = {
  views: number;
  /** The account that posted it, lowercase and without @. Null when it couldn't be read. */
  author: string | null;
  /** When it went live (ISO). Null when it couldn't be read. */
  postedAt: string | null;
};

type Item = Record<string, unknown>;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
};
const handle = (v: unknown) => {
  const s =
    typeof v === "string" ? v.trim().replace(/^@+/, "").toLowerCase() : "";
  return s || null;
};
const iso = (v: unknown): string | null => {
  if (typeof v === "number" && Number.isFinite(v)) {
    // Seconds or milliseconds since 1970.
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === "string" && v) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
};

/** One item from the TikTok scraper (clockworks/tiktok-scraper). */
export function parseTikTok(item: Item): PostReading {
  const meta = (item.authorMeta ?? {}) as Item;
  return {
    views: num(item.playCount),
    author: handle(meta.name),
    postedAt: iso(item.createTimeISO) ?? iso(item.createTime),
  };
}

/** One item from the Instagram scraper (apify/instagram-scraper). */
export function parseInstagram(item: Item): PostReading {
  return {
    views: num(item.videoPlayCount ?? item.videoViewCount),
    author: handle(item.ownerUsername),
    postedAt: iso(item.timestamp),
  };
}

/** A video from YouTube's videos API, plus the handle of its channel (from the channels API). */
export function parseYouTube(video: Item, channelHandle: unknown): PostReading {
  const snippet = (video.snippet ?? {}) as Item;
  const stats = (video.statistics ?? {}) as Item;
  return {
    views: num(stats.viewCount),
    author: handle(channelHandle),
    postedAt: iso(snippet.publishedAt),
  };
}

export type Verdict =
  | { kind: "verified" }
  | { kind: "rejected"; reason: string }
  /** Can't decide yet (the platform didn't say who posted it, or when). Try again later. */
  | { kind: "pending"; reason: string };

/**
 * Does this post count for this creator?
 *   - it must be on one of their own verified accounts on that platform
 *   - it must have gone live after they joined the campaign
 *   - and after THAT account was verified: a post made before the account was connected
 *     can't count, even if it's after joining
 */
export function judgePost({
  reading,
  ownAccounts,
  joinedAt,
}: {
  reading: PostReading;
  /** The creator's verified accounts on this post's platform, and when each was verified. */
  ownAccounts: { handle: string; verifiedAt: string }[];
  joinedAt: Date;
}): Verdict {
  if (!reading.author)
    return {
      kind: "pending",
      reason: "We couldn't see which account posted this yet.",
    };
  if (!reading.postedAt)
    return {
      kind: "pending",
      reason: "We couldn't see when this was posted yet.",
    };

  const clean = (h: string) => h.trim().replace(/^@+/, "").toLowerCase();
  const account = ownAccounts.find((a) => clean(a.handle) === reading.author);
  if (!account) {
    return {
      kind: "rejected",
      reason: `This post is on @${reading.author}, which isn't one of your verified accounts.`,
    };
  }
  const posted = new Date(reading.postedAt).getTime();
  if (posted < joinedAt.getTime()) {
    return {
      kind: "rejected",
      reason:
        "This was posted before you joined the campaign, so it can't count.",
    };
  }
  if (posted < new Date(account.verifiedAt).getTime()) {
    return {
      kind: "rejected",
      reason:
        "This was posted before you connected that account, so it can't count.",
    };
  }
  return { kind: "verified" };
}
