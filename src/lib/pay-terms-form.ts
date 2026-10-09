/**
 * The pay terms as typed into a form: pay per video, how often a payment falls due, the counting window, how long a post
 * stays public, the view bonuses, whether every post earns the base, and where creators post. Pure (no server imports),
 * so the brand's edit page and admin's pay terms page read them the same way. The server still validates the result
 * against the terms schema.
 */
export type PayTermsFields = {
  basePerPost: number;
  cycleSize: number;
  windowDays: number;
  keepPublicDays: number;
  milestones: { views: number; amount: number }[];
  platforms: ("tiktok" | "instagram" | "youtube_shorts")[];
  repostsEarnBase: boolean;
};

const PLATFORMS = ["tiktok", "instagram", "youtube_shorts"] as const;

export function parsePayTermsFields(get: (k: string) => string, getAll: (k: string) => string[]): { ok: true; value: PayTermsFields } | { ok: false; error: string } {
  const num = (k: string) => Number(get(k).replace(/,/g, "").trim());
  const platforms = PLATFORMS.filter((p) => getAll("platforms").includes(p));
  if (platforms.length === 0) return { ok: false, error: "Pick at least one platform." };

  const views = getAll("ms_views").map((x) => x.trim());
  const amounts = getAll("ms_amount").map((x) => x.trim());
  const milestones: { views: number; amount: number }[] = [];
  for (let i = 0; i < Math.max(views.length, amounts.length); i++) {
    const a = views[i] ?? "";
    const b = amounts[i] ?? "";
    if (!a && !b) continue;
    const n = Number(a.replace(/,/g, ""));
    const m = Number(b);
    if (!Number.isFinite(n) || !Number.isFinite(m) || n <= 0 || m <= 0) return { ok: false, error: "Each bonus needs a number of views and an amount above zero." };
    milestones.push({ views: Math.round(n), amount: m });
  }
  if (new Set(milestones.map((m) => m.views)).size !== milestones.length) return { ok: false, error: "Two bonuses have the same number of views." };

  const value: PayTermsFields = {
    basePerPost: num("base"),
    cycleSize: num("cycle"),
    windowDays: num("window"),
    keepPublicDays: num("keep_public"),
    milestones,
    platforms,
    repostsEarnBase: get("reposts_earn_base") === "on",
  };
  if (![value.basePerPost, value.cycleSize, value.windowDays, value.keepPublicDays].every(Number.isFinite)) return { ok: false, error: "Fill in every pay field." };
  return { ok: true, value };
}
