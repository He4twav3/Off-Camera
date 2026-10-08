/**
 * The numbers a brand sees about its campaigns: totals, cost per 1,000 views, a leaderboard of
 * creators and the best posts. Pure (no server imports) so the dashboard and the tests work out
 * the same figures the same way.
 */

export type StatPost = {
  id: string;
  platform: string;
  views: number;
  counted: boolean;
  /** What this post has earned the creator: base plus view bonus. */
  earned: number;
};

export type StatCreator = {
  /** One creator across every campaign of this brand. */
  applicantId: string;
  name: string;
  handle: string;
  posts: StatPost[];
};

export type LeaderRow = {
  rank: number;
  applicantId: string;
  name: string;
  handle: string;
  posts: number;
  views: number;
  bestPost: number;
  earned: number;
  avgViews: number;
};

/** Cost per 1,000 views, or null when nothing has been viewed yet. */
export function cpm(spend: number, views: number): number | null {
  if (views <= 0) return null;
  return Math.round((spend / views) * 1000 * 100) / 100;
}

/** Views per platform, most viewed first. Only posts that count. */
export function platformSplit(posts: StatPost[]): { platform: string; views: number; posts: number }[] {
  const by = new Map<string, { views: number; posts: number }>();
  for (const p of posts) {
    if (!p.counted) continue;
    const cur = by.get(p.platform) ?? { views: 0, posts: 0 };
    cur.views += p.views;
    cur.posts += 1;
    by.set(p.platform, cur);
  }
  return [...by.entries()]
    .map(([platform, v]) => ({ platform, ...v }))
    .sort((a, b) => b.views - a.views);
}

/**
 * Creators ranked by total views on posts that count. Ties share the better order by
 * earnings, then name, so the list never shuffles between loads. Creators with no counted
 * post are left off: a leaderboard ranks results.
 */
export function leaderboard(creators: StatCreator[]): LeaderRow[] {
  const merged = new Map<string, StatCreator>();
  for (const c of creators) {
    const cur = merged.get(c.applicantId);
    if (cur) cur.posts = [...cur.posts, ...c.posts];
    else merged.set(c.applicantId, { ...c, posts: [...c.posts] });
  }
  const rows = [...merged.values()]
    .map((c) => {
      const counted = c.posts.filter((p) => p.counted);
      const views = counted.reduce((n, p) => n + p.views, 0);
      return {
        applicantId: c.applicantId,
        name: c.name,
        handle: c.handle,
        posts: counted.length,
        views,
        bestPost: counted.reduce((m, p) => Math.max(m, p.views), 0),
        earned: Math.round(counted.reduce((n, p) => n + p.earned, 0) * 100) / 100,
        avgViews: counted.length ? Math.round(views / counted.length) : 0,
      };
    })
    .filter((r) => r.posts > 0)
    .sort((a, b) => b.views - a.views || b.earned - a.earned || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}

/** The most viewed posts that count. */
export function topPosts<T extends { views: number; counted: boolean }>(posts: T[], n = 5): T[] {
  return posts
    .filter((p) => p.counted)
    .sort((a, b) => b.views - a.views)
    .slice(0, n);
}
