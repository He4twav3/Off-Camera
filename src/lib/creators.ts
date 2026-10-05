/**
 * Real people and real numbers shown on the brands page. This is the one place
 * to edit them — nothing here is invented, so it starts empty and the page
 * falls back to the posts in lib/proof-content.ts until it's filled in.
 *
 * To add a creator: put their photo in /public/creators/ (square, at least
 * 200x200 — JPG or PNG) and add an entry below. `views` is what they have
 * driven, written the way the proof posts are ("4.2M+", "850K+" — a minimum).
 */

export type CreatorProfile = {
  /** Full name as it should appear. */
  name: string;
  /** Handle without the @. */
  handle: string;
  platform: "TikTok" | "Instagram" | "YouTube";
  /** Path under /public, e.g. "/creators/alex.jpg". */
  avatar: string;
  /** Views this creator has driven, as a minimum: "4.2M+". */
  views: string;
  /** Link to one of their posts or their profile (optional). */
  url?: string;
};

export const CREATOR_PROFILES: CreatorProfile[] = [
  // {
  //   name: "Alex Rivera",
  //   handle: "alexcreates",
  //   platform: "TikTok",
  //   avatar: "/creators/alex.jpg",
  //   views: "4.2M+",
  //   url: "https://www.tiktok.com/@alexcreates",
  // },
];

/**
 * The true all-time total, if it is bigger than the sum of the posts listed in
 * lib/proof-content.ts — e.g. "43.6M". Written without a "+": it is shown exactly as
 * given. Leave null to show the sum of those posts (a minimum, shown with a "+").
 */
export const TOTAL_VIEWS_DRIVEN: string | null = "43.6M";
