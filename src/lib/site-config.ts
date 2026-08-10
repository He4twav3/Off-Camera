/**
 * Single source of truth for site-wide identity: name, URL, description,
 * pricing. Used by metadata, OG images, sitemap, robots, and structured data
 * so they never drift out of sync with each other.
 *
 * TODO before going live: replace `url` with your real domain (also set it
 * as NEXT_PUBLIC_SITE_URL in your deploy env) and swap the placeholder
 * contact email for a real inbox.
 */
export const siteConfig = {
  name: "Off Camera",
  tagline: "Go viral without showing your face.",
  description:
    "A hands-on course on creating faceless viral content, UGC for brands, and getting picked for campaigns, taught from real creator experience by Aron.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://offcamera.example.com",
  contactEmail: "support@offcamera.example.com",
  creator: {
    name: "Aron",
    role: "Full-time faceless UGC creator",
  },
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
    intro: undefined as string | undefined,
    story: undefined as string | undefined,
  },
  // Real community, once it exists: a Discord/Circle/Skool invite link.
  // Until then, every "community" touchpoint on the site (dashboard
  // resources, the pricing inclusion list) is honest about there being no
  // live invite yet rather than linking somewhere fake.
  communityUrl: undefined as string | undefined,
} as const;
