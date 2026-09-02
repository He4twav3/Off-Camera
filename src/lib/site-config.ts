/**
 * Single source of truth for site-wide identity: name, URL, description,
 * pricing. Used by metadata, OG images, sitemap, robots, and structured data
 * so they never drift out of sync with each other.
 *
 * TODO before going live: replace `url` with your real domain (also set it
 * as NEXT_PUBLIC_SITE_URL in your deploy env).
 */
export const siteConfig = {
  name: "On Camera",
  tagline: "You don't need a following to get views.",
  description:
    "Real breakdowns of our own videos that reached millions of views, and the repeatable system behind them: hooks, retention, formats, volume, consistency, and iteration. On camera, not showing your face, silent, UGC, demo, or screen recording — the format is flexible, the formula isn't.",
  /**
   * Single source of truth for the course product's name, so it can't
   * drift out of sync the way the old "Off Camera: Faceless Content &
   * Brand Deals" string did across ~8 separate hardcoded copies
   * (course-hero, marketplace card, structured data, checkout, payment
   * descriptions, emails, OG images). Every one of those now reads this.
   */
  courseTitle: "On Camera: The Content Formula",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://oncamera.example.com",
  price: {
    amount: 17.99,
    currency: "EUR",
    symbol: "€",
    get formatted() {
      return `${this.symbol}${this.amount.toFixed(2)}`;
    },
  },
  social: {
    instagram: "#",
    tiktok: "#",
    youtube: "#",
  },
  // Real video, once it exists: drop in unlisted YouTube video ids (the
  // part after `?v=` in the URL — an unlisted video works fine, it never
  // needs to be public) and the Hero/Story sections switch from the
  // simulated placeholder player to a real embed automatically. See
  // VideoPlayer's `youtubeId` prop for how this is consumed, and
  // curriculum.ts's MODULE_VIDEO_IDS for the per-module equivalent. Left
  // empty on purpose — placeholders, not stand-in footage from other
  // creators.
  videos: {
    intro: "aqz-KE-bpKQ" as string | undefined,
    story: undefined as string | undefined,
  },
  // Discord invite link — the site's one support/contact channel. Every
  // "contact us" touchpoint (legal pages, About, footer, FAQ, dashboard
  // resources) reads this via components/site/discord-link.tsx instead of
  // an email address.
  communityUrl: "https://discord.gg/2Wy5m9avX" as string | undefined,
} as const;
