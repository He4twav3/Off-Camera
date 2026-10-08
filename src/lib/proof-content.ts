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
 * Every `views`/`likes` figure here is a real public count read off the
 * post itself — nothing here is invented. Every entry has a real `postUrl` (the video itself is live)
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
  /** Real like count as a lower bound, e.g. "122K+". */
  likes?: string;
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
  // Six reels, one per creator and one per format, picked from 13 live posts by
  // views. `views` and `likes` are the public counts read off each post on
  // 2026-10-08, written as lower bounds so they stay true as the posts keep
  // climbing. `src` is a silent 12-second loop of the post for the course
  // hero carousel; the poster is the post's own cover, self-hosted.
  {
    id: "heidi",
    label: "Talking head, screenshots on top.",
    views: "1.99M+",
    statsLabel: "1.9M+",
    likes: "122K+",
    postUrl: "https://www.instagram.com/reel/Dcr0Fh-s5aG/",
    src: "/proof-videos/heidi.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Straight to camera, with screenshots of each step popping up over the shot.",
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "austin",
    label: "Point at the screen. That's it.",
    views: "1.09M+",
    statsLabel: "1M+",
    likes: "74.9K+",
    postUrl: "https://www.instagram.com/reel/DaCD0ogMoz_/",
    src: "/proof-videos/austin.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Phone filming the laptop screen, a pen pointing out each click, quick cuts to the creator's face.",
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "patrick",
    label: "One take. No edits.",
    views: "312K+",
    likes: "27.6K+",
    postUrl: "https://www.instagram.com/reel/DZxqzMAOuHX/",
    src: "/proof-videos/patrick.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "One continuous sit-down shot, talking to camera, captions only.",
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "jake",
    label: "Under 40 seconds, on a timer.",
    views: "309K+",
    likes: "10.3K+",
    postUrl: "https://www.instagram.com/reel/DeKroo5tACY/",
    src: "/proof-videos/jake.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Split screen: hands on the keyboard with a running stopwatch above, the screen recording of each step below.",
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "gigi",
    label: "Selfie hook, then the walkthrough.",
    views: "224K+",
    likes: "6K+",
    postUrl: "https://www.instagram.com/reel/DdIvMvUOzE0/",
    src: "/proof-videos/gigi.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Opens on a selfie with a one-line text hook, then a filmed phone-and-laptop walkthrough with text steps.",
      retention: ANALYSIS_PENDING,
      whyItWorked: ANALYSIS_PENDING,
      lesson: ANALYSIS_PENDING,
    },
  },
  {
    id: "tony",
    label: "Dressed up, cut with b-roll.",
    views: "146K+",
    likes: "17K+",
    postUrl: "https://www.instagram.com/reel/DdS4MWwtTmX/",
    src: "/proof-videos/tony.mp4",
    breakdown: {
      hook: ANALYSIS_PENDING,
      format: "Suited talking head on a styled set, cut with screen shots and cinematic b-roll.",
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
