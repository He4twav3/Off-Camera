/**
 * The creators we manage, and the total views they have driven. This is the one
 * place to edit them: the brands page reads everything it shows about creators
 * from here.
 *
 * `views` is what each account has driven, written the way view counts are
 * elsewhere ("8.72M", "850K"). NOTE: until real per-account figures are filled
 * in, the five below are an EVEN SPLIT of the stated total (43.6M / 5 = 8.72M)
 * — an allocation, not a measurement. Replace each with the account's real
 * number when you have it.
 */

export type CreatorProfile = {
  /** Handle without the @. */
  handle: string;
  /** Views this account has driven, e.g. "8.72M". */
  views: string;
};

export const CREATOR_PROFILES: CreatorProfile[] = [
  { handle: "itsleo.creates", views: "8.72M" },
  { handle: "byella.studio", views: "8.72M" },
  { handle: "miaonfilm", views: "8.72M" },
  { handle: "careercraft.ai", views: "8.72M" },
  { handle: "careervaultt", views: "8.72M" },
];

/** The stated all-time total across everyone, shown exactly as written. */
export const TOTAL_VIEWS_DRIVEN: string | null = "43.6M";
