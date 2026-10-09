// TEMPORARY. Never committed. Made-up posts for the Getimg campaign, in different states.
import { iso } from "./_data";
import { GETIMG_LOGO } from "./_getimg-logo";
import type { PostRowData } from "@/lib/post-terms";

const day = 24 * 60 * 60 * 1000;
const at = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();
const ends = (daysAgo: number) => new Date(Date.now() - daysAgo * day + 30 * day).toISOString();

const finals = [840, 1320, 5410, 2210, 980, 12480, 3300, 1760, 640, 7020, 2950, 1480, 4100, 1020, 2640];
const counting = [2180, 960, 4100, 7800, 310, 1500, 5200];

// Cycle 1: 15 finished posts. Cycle 2: 7 still counting. Plus one being checked and one rejected.
export const getimgPosts: PostRowData[] = [
  ...finals.map((v, i): PostRowData => ({
    id: `f${i + 1}`, platform: i % 3 === 0 ? "instagram" : i % 3 === 1 ? "tiktok" : "youtube_shorts",
    url: `https://www.tiktok.com/@maya/video/70000000000000${100 + i}`, state: "final", authorVerified: true, views: v,
    submittedAt: at(75 - i * 2.5), windowEndsAt: ends(75 - i * 2.5), rejectReason: null, lastError: null,
  })),
  ...counting.map((v, i): PostRowData => ({
    id: `c${i + 1}`, platform: i % 2 === 0 ? "tiktok" : "instagram", url: `https://www.tiktok.com/@maya/video/71000000000000${100 + i}`, state: "counting",
    authorVerified: true, views: v, submittedAt: at(26 - i * 3.5), windowEndsAt: ends(26 - i * 3.5), rejectReason: null, lastError: null,
  })),
  { id: "k1", platform: "instagram", url: "https://www.instagram.com/reel/C9aBcDeFg/", state: "counting", authorVerified: false, views: 0, submittedAt: at(0.1), windowEndsAt: null, rejectReason: null, lastError: "We couldn't see which account posted this yet." },
  { id: "r1", platform: "tiktok", url: "https://www.tiktok.com/@viralguy/video/72000000000000999", state: "rejected", authorVerified: false, views: 0, submittedAt: at(2), windowEndsAt: null, rejectReason: "This post is on @viralguy, which isn't one of your verified accounts.", lastError: null },
];

export const brief = [
  "Make clear, product-led content: turn a simple Getimg feature into a strong ad hook",
  "High-volume UGC that helps our paid ads stand out and perform better than standard creative",
  "Post on Instagram, TikTok or YouTube",
  "Keep every post public for 90 days",
  "Every video must be genuinely new: no repeats or bulk posting to fill the count",
  "Use only music, images and fonts you have the rights to",
  "Label every post as a paid partnership (#ad)",
].join("\n");

export const getimgJob = {
  id: "j-getimg", title: "Getimg", platform: "tiktok", status: "open", payout_type: "flat",
  payout_amount: 20, payout_notes: null, account_requirement: "new_ok", description: brief, payout_terms: null, post_terms: null, about: "Getimg is an all-in-one creative AI workspace for generating and editing images, video, music, speech and sound. We are looking for creators who can make high-volume UGC that helps our paid ads stand out and perform better than standard creative. If you create clear, product-led content and can turn a simple feature into a strong ad hook, this is a good fit.", formats: "Speed challenge: do something with Getimg in N seconds, no yapping\nStep by step: screen-record your build with step-by-step text overlays\nPain-point hook: open with a problem (for example \"Tired of your 9 to 5?\"), then show what you made\nTalking head: on camera, with a bold line of text in the first second", example_urls: [], logo_url: GETIMG_LOGO,
  niches: { label: "Tech" },
} as never;

export { iso };
