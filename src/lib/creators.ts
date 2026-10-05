/**
 * The creators we manage, and the total views they have driven. This is the one
 * place to edit them: the brands page reads everything it shows about creators
 * from here.
 *
 * `views` is what each account has driven, written the way view counts are
 * elsewhere ("7.1M", "850K").
 *
 * HOW THE CURRENT FIGURES WERE SET (replace with real per-account numbers):
 *  - careercraft.ai 25.1M and careervaultt 1.1M come from the real posts in
 *    lib/proof-content.ts (four TikTok posts on @career.craftai = 25.1M+, one
 *    Instagram post = 1.1M+). Which account each belongs to is an ASSUMPTION.
 *  - The remaining 17.4M (43.6M stated total - 26.2M above) is split across the
 *    three creators as 7.1M / 5.9M / 4.4M. That split is a PLACEHOLDER, not a
 *    measurement.
 * They add up to exactly the stated total, 43.6M.
 */

export type CreatorProfile = {
  /** Handle without the @. */
  handle: string;
  /** Views this account has driven, e.g. "7.1M". */
  views: string;
};

export const CREATOR_PROFILES: CreatorProfile[] = [
  { handle: "itsleo.creates", views: "7.1M" },
  { handle: "byella.studio", views: "5.9M" },
  { handle: "miaonfilm", views: "4.4M" },
  { handle: "careercraft.ai", views: "25.1M" },
  { handle: "careervaultt", views: "1.1M" },
];

/** The stated all-time total across everyone, shown exactly as written. */
export const TOTAL_VIEWS_DRIVEN: string | null = "43.6M";
