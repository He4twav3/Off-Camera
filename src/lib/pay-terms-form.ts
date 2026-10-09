/**
 * The pay terms as typed into a form: pay per video, how often a payment falls due, the counting window, how long a post
 * stays public, where creators post, and the CPM bands for views. Pure (no server imports), so the brand's pages and
 * admin's page read them the same way. The server still validates the result against the terms schema.
 */
import type { CpmTier } from "@/lib/post-terms";

const PLATFORMS = ["tiktok", "instagram", "youtube_shorts"] as const;

export type PayTermsFields = {
  basePerPost: number;
  cycleSize: number;
  windowDays: number;
  keepPublicDays: number;
  platforms: (typeof PLATFORMS)[number][];
  /** undefined when every CPM row was left blank: the campaign's existing view pay is then left as it is. */
  cpm: CpmTier[] | undefined;
  /** The most views that earn CPM pay on one post; undefined for no cap. */
  cpmCap: number | undefined;
};

/** The CPM rows: a "from views" and a rate. A blank "from" means from the first view. Both blank skips the row. */
export function parseCpmRows(getAll: (k: string) => string[]): { ok: true; value: CpmTier[] | undefined } | { ok: false; error: string } {
  const from = getAll("cpm_from").map((x) => x.replace(/,/g, "").trim());
  const rate = getAll("cpm_rate").map((x) => x.replace(/,/g, "").trim());
  const tiers: CpmTier[] = [];
  for (let i = 0; i < Math.max(from.length, rate.length); i++) {
    const a = from[i] ?? "";
    const b = rate[i] ?? "";
    if (!a && !b) continue;
    const f = a === "" ? 0 : Number(a);
    const r = Number(b);
    if (b === "" || !Number.isFinite(r) || r <= 0) return { ok: false, error: "Each CPM row needs a CPM above zero." };
    if (!Number.isInteger(f) || f < 0) return { ok: false, error: "The views a CPM starts at must be a whole number, 0 or more." };
    tiers.push({ from: f, rate: r });
  }
  if (new Set(tiers.map((t) => t.from)).size !== tiers.length) return { ok: false, error: "Two CPM rows start at the same number of views." };
  return { ok: true, value: tiers.length ? tiers.sort((x, y) => x.from - y.from) : undefined };
}

export function parsePayTermsFields(get: (k: string) => string, getAll: (k: string) => string[]): { ok: true; value: PayTermsFields } | { ok: false; error: string } {
  const num = (k: string) => Number(get(k).replace(/,/g, "").trim());
  const platforms = PLATFORMS.filter((p) => getAll("platforms").includes(p));
  if (platforms.length === 0) return { ok: false, error: "Pick at least one platform." };
  const cpm = parseCpmRows(getAll);
  if (!cpm.ok) return cpm;
  const rawCap = get("cpm_cap").replace(/,/g, "").trim();
  let cpmCap: number | undefined;
  if (rawCap) {
    const c = Number(rawCap);
    if (!Number.isInteger(c) || c < 1) return { ok: false, error: "The view cap must be a whole number of views, 1 or more." };
    cpmCap = c;
  }
  const value: PayTermsFields = {
    basePerPost: num("base"),
    cycleSize: num("cycle"),
    windowDays: num("window"),
    keepPublicDays: num("keep_public"),
    platforms,
    cpm: cpm.value,
    cpmCap,
  };
  if (![value.basePerPost, value.cycleSize, value.windowDays, value.keepPublicDays].every(Number.isFinite)) return { ok: false, error: "Fill in every pay field." };
  return { ok: true, value };
}

/** What the saved pay terms become: the new numbers, and CPM replaces the fixed bonuses only when the brand entered some. */
export function mergePayTerms<T extends { milestones: { views: number; amount: number }[]; cpm?: CpmTier[]; cpmCap?: number }>(current: T, pay: PayTermsFields) {
  const { cpm, cpmCap, ...rest } = pay;
  return cpm ? { ...current, ...rest, cpm, cpmCap, milestones: [] } : { ...current, ...rest };
}
