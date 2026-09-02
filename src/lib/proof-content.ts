/**
 * Single source of truth for the site's real proof: our own high-
 * performing videos, not AI-generated testimonials or invented case
 * studies. Feeds the Proof Showcase (proof-showcase.tsx, shown on both
 * `/` and `/course`) and the real stat tiles in stats.tsx, so a view
 * count only ever has to be typed in one place.
 *
 * This file is Knowledge Base A in the two-knowledge-base split: our
 * actual published videos, public and free, used as proof and to derive
 * the methodology. Knowledge Base B is curriculum.ts — the paid training
 * itself. Don't mix them: nothing here should describe what happens
 * inside a paid lesson, and nothing in curriculum.ts should claim to
 * have analyzed a specific clip from this file.
 *
 * Breakdown-writing discipline, for whenever a real clip gets analyzed:
 * separate OBSERVATION (what's literally on screen/said — "the creator
 * shows the product while text reads X") from INTERPRETATION (why that
 * matters — "this opens an information gap because..."). Don't assert a
 * causal claim ("this is why it got views") the evidence doesn't support
 * — describe the mechanism, not a guaranteed outcome.
 *
 * Every `views` figure here is one you gave directly — nothing here is
 * invented. Every entry has a real `postUrl` (the video itself is live)
 * but most `breakdown` fields are still pending — a link tells us the
 * video exists, not what's in it, so those stay marked pending until you
 * walk me through each one (or write it yourself).
 *
 * Every entry here gets the real, playable-on-page treatment (PlatformEmbed)
 * — no lighter-weight "just a link" tier. That used to exist as a
 * separate PROOF_WALL, removed on purpose: either a video is worth
 * displaying for real, or it doesn't belong on the page at all.
 *
 * Never name the specific app any of these were made for, on this site
 * or in code comments — refer to it generically ("an app we created
 * content for").
 */

export type ProofBreakdown = {
  /** What happened in the first few seconds. */
  hook: string;
  /** On-camera / not showing a face / silent / UGC / demo, and how simple the production actually was. */
  format: string;
  /** The structural/pacing mechanism that kept people watching. */
  retention: string;
  /** The underlying mechanic (curiosity, payoff, relatability), not just "it was good." */
  whyItWorked: string;
  /** The repeatable takeaway, applicable to a different product. */
  lesson: string;
};

/** Standard placeholder for a breakdown field on an entry whose video IS live (postUrl set) but hasn't been analyzed yet. */
const ANALYSIS_PENDING = "Breakdown coming — the video is live at the link above, this write-up isn't done yet.";

export type ProofEntry = {
  id: string;
  /** Headline shown on the card badge — can be a number ("15.1M+ views") or a qualitative hook ("No talking. Still viral."). */
  label: string;
  /**
   * Real, approximate view count, e.g. "15.1M+" — separate from `label`
   * so a qualitative headline can still carry a real number. This is the
   * real, precise number shown on the video's own card — never rounded,
   * never touched for display purposes elsewhere.
   */
  views?: string;
  /**
   * A rounded-down display number for the top-of-page quick-stats strip
   * only (stats.tsx) — e.g. "15M+" for a real 15.1M+. Exists so that
   * strip can show a clean floor number that stays true forever as the
   * real count keeps climbing, without touching the real, precise number
   * on the video's own card. Falls back to `views` when not set — most
   * entries don't need this, only ones where the precise figure has
   * enough extra digits to be worth rounding for that one summary spot.
   */
  statsLabel?: string;
  /**
   * Link to the real post, on the real account, e.g.
   * "https://www.tiktok.com/@handle/video/1234567890" — the primary
   * proof mechanism: visitors click through and see it live, with the
   * real account, real engagement, real comments attached. Platform
   * (for the link's label/icon) is inferred from the URL's host, see
   * `platformFromUrl` below.
   */
  postUrl?: string;
  /** Real, directly-playable inline source — see VideoPlayer. Optional, in addition to postUrl. */
  src?: string;
  /** Real YouTube id for an inline embed — see VideoPlayer. Optional, in addition to postUrl. */
  youtubeId?: string;
  breakdown: ProofBreakdown;
};

/**
 * Whether a single breakdown field is still a placeholder, vs. real
 * written analysis. Lets ProofShowcase render only the fields that
 * actually have something to say instead of a full 5-card grid padded
 * out with repeated "coming soon" text — which reads as noise
 * (especially stacked on mobile), not proof. Fields reappear on their
 * own once written in for real, no manual toggle to remember.
 */
export function isPendingBreakdown(text: string): boolean {
  return text === ANALYSIS_PENDING || text.startsWith("Video coming —");
}

export const PROOF_CONTENT: ProofEntry[] = [
  {
    id: "flagship-a",
    // Qualitative headline (same pattern as "no-talking" below) instead
    // of just restating the number — the real, precise view count still
    // shows as its own badge next to this one (see proof-showcase.tsx's
    // badge-pair logic), untouched.
    label: "No face. Still viral.",
    views: "15.1M+",
    // Rounded floor number for the top-of-page quick-stats strip only
    // (stats.tsx) — the real 15.1M+ above is what actually displays on
    // this card, never rounded.
    statsLabel: "15M+",
    postUrl: "https://vt.tiktok.com/ZSVHkQ1Qb/",
    // Real, self-hosted export of this exact clip — matched against the
    // live post by its own on-screen caption ("this generation is
    // cooked"), which is baked into both. Lets the hero's ring carousel
    // (hero-carousel.tsx) autoplay it silently, which neither TikTok's
    // nor Instagram's embed widget will ever do (see platform-embed.tsx).
    src: "/proof-videos/flagship-a.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      // Deliberately a teaser, not the full breakdown — free proof this
      // is real and worth taking seriously, not the actual mechanism.
      // The full hook/retention/why-it-worked breakdown is paid-course
      // content, not a public landing-page giveaway.
      format: "No face on screen at any point — hands and the product carry the entire video.",
      retention: ANALYSIS_PENDING,
      whyItWorked:
        "There's a specific reason the first couple seconds stop the scroll here. Not luck, and not unique to this video — Module 1 breaks down exactly what it is.",
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "flagship-b",
    label: "5.3M+ views",
    views: "5.3M+",
    postUrl: "https://vt.tiktok.com/ZSVHkPN9t/",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Same principle as the 15.1M+ video above — no face shown, no talking, still 5.3M+ views.",
      retention: ANALYSIS_PENDING,
      whyItWorked:
        "A different hook mechanism than the video above, same underlying system behind both. Module 1 covers it.",
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "flagship-c",
    label: "3M+ views",
    views: "3M+",
    postUrl:
      "https://www.tiktok.com/@career.craftai/video/7634288638553083144",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Same account, same principle as the two videos above — no face shown, no talking, still 3M+ views.",
      retention: ANALYSIS_PENDING,
      whyItWorked:
        "A third example of the same underlying system, a different angle again. All three breakdowns land in Module 1.",
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "no-talking",
    label: "No talking. Still viral.",
    views: "1.1M+",
    postUrl: "https://www.instagram.com/reel/DalTZPbRXSg/",
    // Real export of this exact reel — matched against the live post by
    // its own on-screen caption ("Making a doctors salary in 30 seconds
    // without saying a word"), which is baked into both. See flagship-a's
    // own note on why this is what makes real autoplay possible at all.
    src: "/proof-videos/no-talking.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Silent product demonstration — no speaking, no on-camera face.",
      retention: ANALYSIS_PENDING,
      // Same discretion as flagship-a/b/c above — a teaser, not the
      // mechanism. This used to spell out exactly what makes the opening
      // text work as a hook, which gave away on the free page what
      // Module 1 is supposed to be worth paying for.
      whyItWorked:
        "There's a specific reason this stops the scroll before the product ever appears. Not a guess — Module 1 breaks down exactly what it is.",
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "flagship-d",
    label: "1.7M+ views",
    views: "1.7M+",
    postUrl: "https://vt.tiktok.com/ZSVgHKLM3/",
    // Nothing here is assumed from the account it shares with flagship-c
    // — every field below stays pending until actually watched and
    // written up, same as the others were before their format lines got
    // filled in.
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: ANALYSIS_PENDING,
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  // Three more real, live posts from the same account, added from a
  // fresh batch of links — `views` is deliberately left unset on all
  // three (see the header note: every number here is one you gave
  // directly, never fetched or guessed). TikTok's own video page never
  // publishes a raw view count in the first place — only likes,
  // comments and shares are public there; the real number lives in the
  // account's private analytics. Once you have it, add
  // `views: "X+"` (and a matching `statsLabel` only if it needs
  // rounding for the top-of-page strip, see flagship-a).
  {
    id: "flagship-e",
    // Label is a close paraphrase of the video's own real on-screen
    // caption ("people cheat on EVERYTHING these days"), not invented.
    label: "People cheat on everything now.",
    postUrl: "https://vt.tiktok.com/ZSVHkp3TQ/",
    src: "/proof-videos/flagship-e.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: ANALYSIS_PENDING,
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "flagship-f",
    // Paraphrase of the real on-screen caption ("14 failed interviews
    // and now I find this lol").
    label: "14 failed interviews. Then this.",
    postUrl: "https://vt.tiktok.com/ZSVHkbvdR/",
    src: "/proof-videos/flagship-f.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: ANALYSIS_PENDING,
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "flagship-g",
    // Paraphrase of the real on-screen caption ("Round 2 interview for
    // Tesla $178k/yr position with chatgpt").
    label: "Round 2 Tesla interview — with ChatGPT.",
    postUrl: "https://www.instagram.com/reel/DTyZ3FhiKQG/",
    src: "/proof-videos/flagship-g.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: ANALYSIS_PENDING,
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  "tiktok.com": "TikTok",
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
};

/**
 * Human-readable platform name from a post URL's host, for the "Watch
 * on ___" link. Matches by suffix, not exact host, so subdomains work
 * too — TikTok's share links come off `vt.tiktok.com`/`vm.tiktok.com`,
 * not `tiktok.com` itself. Falls back to "the original post" if the
 * host isn't recognized.
 */
export function platformFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    const match = Object.keys(PLATFORM_LABELS).find(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    );
    return match ? PLATFORM_LABELS[match] : "the original post";
  } catch {
    return "the original post";
  }
}
