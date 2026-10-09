import "server-only";
import { getProofPosters } from "@/lib/proof-thumbnails";
import { compactViews } from "@/lib/format";
import { CREATOR_PROFILES, TOTAL_VIEWS_DRIVEN, type CreatorProfile } from "@/lib/creators";

export { compactViews };

/**
 * The real posts behind the brands page: our own TikTok and Instagram content,
 * with the account each one was posted from and its real view count. These
 * are the same proof entries the course page uses (lib/proof-content.ts) —
 * not invented creators. View counts are written as lower bounds ("15.1M+"),
 * so every total derived here is a lower bound too and is shown with a "+".
 *
 * Account handles are read from each post's own public page (TikTok oEmbed,
 * Instagram's embed page), cached for an hour. If one can't be resolved the
 * post is shown by platform alone — never with a guessed handle.
 */

const REVALIDATE_SECONDS = 3600;

export type ReelPost = {
  id: string;
  platform: "TikTok" | "Instagram";
  handle: string | null;
  views: string; // as written, e.g. "15.1M+"
  viewsNum: number; // lower bound
  likes: string | null; // as written, e.g. "122K+"
  thumbnail: string | null;
  postUrl: string;
};

export type ReelProfile = CreatorProfile & { viewsNum: number };

export type ProofReel = {
  posts: ReelPost[]; // most-viewed first
  /** Real creators with photos (lib/creators.ts), most-viewed first. Empty until filled in. */
  profiles: ReelProfile[];
  /** The headline total: the stated all-time total if given, else the sum of the posts. */
  totalViews: number;
  /** True when totalViews is the stated figure and is larger than the posts' sum. */
  totalIsStated: boolean;
  platformViews: { platform: "TikTok" | "Instagram"; views: number; share: number }[];
};

/** "15.1M+" -> 15_100_000. Anything that isn't a real number returns null. */
export function parseViews(text: string | undefined): number | null {
  const m = text?.trim().match(/^(\d+(?:\.\d+)?)\s*([MK])?\+?$/i);
  if (!m) return null;
  const n = Number(m[1]) * (m[2]?.toUpperCase() === "M" ? 1_000_000 : m[2]?.toUpperCase() === "K" ? 1_000 : 1);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

async function resolveHandle(platform: "TikTok" | "Instagram", postUrl: string): Promise<string | null> {
  const fromUrl = postUrl.match(/\/@([\w.]+)\//)?.[1];
  if (fromUrl) return fromUrl;
  try {
    if (platform === "TikTok") {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(postUrl)}`, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { author_unique_id?: unknown; author_url?: unknown };
      if (typeof data.author_unique_id === "string" && data.author_unique_id) return data.author_unique_id;
      if (typeof data.author_url === "string") return data.author_url.match(/\/@([\w.]+)/)?.[1] ?? null;
      return null;
    }
    const res = await fetch(`${postUrl.replace(/\/?$/, "/")}embed/captioned/`, {
      headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/class="[^"]*UsernameText[^"]*"[^>]*>([\w.]+)</)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function getProofReel(): Promise<ProofReel> {
  const posters = await getProofPosters();
  const real = posters.flatMap((p) => {
    const viewsNum = parseViews(p.views);
    if (!p.platform || !p.postUrl || !p.views || viewsNum === null) return [];
    return [{ p, viewsNum, platform: p.platform, postUrl: p.postUrl, views: p.views }];
  });

  const posts: ReelPost[] = await Promise.all(
    real.map(async ({ p, viewsNum, platform, postUrl, views }) => ({
      id: p.id,
      platform,
      handle: await resolveHandle(platform, postUrl),
      views,
      viewsNum,
      likes: p.likes ?? null,
      thumbnail: p.thumbnail,
      postUrl,
    })),
  );
  posts.sort((a, b) => b.viewsNum - a.viewsNum);

  const postsTotal = posts.reduce((n, p) => n + p.viewsNum, 0);
  const stated = parseViews(TOTAL_VIEWS_DRIVEN ?? undefined);
  const totalIsStated = stated !== null && stated > postsTotal;
  const totalViews = totalIsStated ? stated : postsTotal;

  const profiles: ReelProfile[] = CREATOR_PROFILES.flatMap((c) => {
    const viewsNum = parseViews(c.views);
    return viewsNum === null ? [] : [{ ...c, viewsNum }];
  }).sort((a, b) => b.viewsNum - a.viewsNum);
  const platformViews = (["TikTok", "Instagram"] as const)
    .map((platform) => {
      const views = posts.filter((p) => p.platform === platform).reduce((n, p) => n + p.viewsNum, 0);
      // The split is across the listed posts only, even when the headline total is larger.
      return { platform, views, share: postsTotal ? views / postsTotal : 0 };
    })
    .filter((x) => x.views > 0);

  return { posts, profiles, totalViews, totalIsStated, platformViews };
}
