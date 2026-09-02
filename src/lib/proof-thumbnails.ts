import "server-only";

import { statSync } from "node:fs";
import { join } from "node:path";
import { PROOF_CONTENT, type ProofEntry } from "@/lib/proof-content";

/** The file's own last-modified time, as a cache-busting query value —
 * see its call site below for why this exists. Never throws: a file
 * that can't be stat'd (moved, permissions) just gets no version
 * suffix, which is exactly the previous unversioned behavior, not a
 * broken video. */
function videoVersion(publicPath: string): number | "" {
  try {
    return statSync(join(process.cwd(), "public", publicPath)).mtimeMs;
  } catch {
    return "";
  }
}

/**
 * Real poster frames for the real videos, resolved on the server.
 *
 * The hero's proof reel needs an image per video before anything is
 * painted — it is the first thing on the page and the whole reason the
 * hero reads as evidence rather than as a claim. Resolving those images
 * the way PlatformEmbed does (per-card, in the browser, after hydration,
 * with a random stagger and two retries against TikTok's rate limiter)
 * is right for a deep-in-the-page card that can afford to arrive late.
 * It is wrong for the hero: it would leave the most important element on
 * the site empty for the first second of every visit, and five parallel
 * client fetches is exactly the burst that triggers the rate-limiting in
 * the first place.
 *
 * Here it happens once, server-side, cached (see REVALIDATE_SECONDS), and
 * shared by every visitor. No CORS, no waterfall, no per-visitor request
 * to TikTok or Instagram at all.
 *
 * IMPORTANT — what is deliberately thrown away. TikTok's oEmbed response
 * also carries `title` (the caption, hashtags included) and `author_name`
 * (the handle). Both of those name the specific account and app these
 * videos were made for, which PRODUCT_VISION.md §17 rules out stating
 * anywhere on the site. Only `thumbnail_url` is read out of the response;
 * nothing else from it ever reaches a component, so there is no way for
 * that copy to leak onto the page by someone later rendering a field that
 * happened to be in scope.
 */

/** One hour. Long enough that TikTok/Instagram are called rarely, short
 * enough that the signed CDN URLs in the response (they carry their own
 * expiry) are refreshed well inside their lifetime. */
const REVALIDATE_SECONDS = 3600;

export type ProofPoster = {
  id: string;
  /** Resolved poster image, or null when it couldn't be resolved. */
  thumbnail: string | null;
  /**
   * A real, directly-playable video file (an .mp4/.webm path/URL) —
   * passed straight through from `ProofEntry.src`, the same field
   * `VideoPlayer` already uses elsewhere on the page. When set, the
   * hero's ring carousel (hero-carousel.tsx) renders this as a silent,
   * autoplaying, looping `<video>` instead of a static poster image —
   * real footage, not a platform embed, which is what makes ambient
   * autoplay possible at all (TikTok's/Instagram's own embeds refuse to
   * autoplay — see platform-embed.tsx's own note, confirmed by direct
   * testing). Optional: an entry with no self-hosted file falls back to
   * the resolved poster image below, same as always.
   */
  video?: string;
  /** The real view count, e.g. "15.1M+". */
  views?: string;
  /** The card's own headline, e.g. "No face. Still viral." */
  label: string;
  postUrl?: string;
  platform: "TikTok" | "Instagram" | null;
};

function platformOf(entry: ProofEntry): ProofPoster["platform"] {
  if (!entry.postUrl) return null;
  try {
    const host = new URL(entry.postUrl).hostname;
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "TikTok";
    if (host === "instagram.com" || host.endsWith(".instagram.com")) return "Instagram";
  } catch {
    // not a valid URL — treated as "no platform", same as no link
  }
  return null;
}

/**
 * A single oEmbed lookup. Never throws and never rejects: a poster that
 * can't be resolved is a `null` thumbnail, which the reel renders as a
 * typographic tile instead (see proof-reel.tsx). An outage at TikTok
 * must degrade the hero, never break the page — which is also why there
 * is a hard timeout here rather than an unbounded await: a hanging
 * upstream request would otherwise hold up the whole server render.
 */
async function fetchTikTokPoster(postUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(postUrl)}`,
      { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(4000) }
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    // Narrowed by hand rather than cast: this is a third-party payload,
    // and the only field taken out of it is this one string.
    if (
      typeof data === "object" &&
      data !== null &&
      "thumbnail_url" in data &&
      typeof (data as { thumbnail_url: unknown }).thumbnail_url === "string"
    ) {
      return (data as { thumbnail_url: string }).thumbnail_url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Instagram has no unauthenticated oEmbed endpoint (it has required an
 * app token since the Facebook Graph migration), but it still serves the
 * plain embed page — `/embed/captioned/` — to anyone, no login, no
 * token: it's the exact page their own embed.js (platform-embed.tsx)
 * fetches into an iframe client-side. That page's markup carries the
 * post's real cover image on an `<img class="EmbeddedMediaImage">`, so
 * this pulls that one attribute out of it the same way fetchTikTokPoster
 * pulls `thumbnail_url` out of a documented API response — just against
 * undocumented markup instead of a contract, which is why it degrades on
 * a much wider range of failures than the TikTok lookup: a redesign, a
 * login-wall served to a datacenter IP instead of the real page,
 * anything. Any of that returns null and the entry renders as the same
 * typographic tile a resolution failure has always meant here — never a
 * broken image, never a scrape treated as more reliable than it is.
 */
async function fetchInstagramPoster(postUrl: string): Promise<string | null> {
  try {
    const embedUrl = `${postUrl.replace(/\/?$/, "/")}embed/captioned/`;
    const response = await fetch(embedUrl, {
      // A plain server-side fetch with no User-Agent reads as a bot to a
      // lot of anti-scraping middleware; a real mobile Safari UA is what
      // was actually verified to get the real page back instead of a
      // login wall.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const tag = html.match(/<img[^>]*class="[^"]*EmbeddedMediaImage[^"]*"[^>]*>/);
    const src = tag?.[0].match(/src="([^"]+)"/);
    if (!src) return null;
    // The regex pulls the attribute's raw HTML source, entities and all —
    // Instagram's markup correctly writes the query string's "&" as
    // "&amp;" the way any HTML attribute has to. A real HTML parser
    // decodes that on the way into the DOM; this string never goes
    // through one, it goes straight from here into React's `src` prop,
    // which re-*encodes* it when serializing the page — so a raw
    // "&amp;" comes out the other end as "&amp;amp;", the browser only
    // undoes one layer of that, and the signed URL it actually requests
    // has literal "&amp;" text sitting in place of "&" between params
    // and 403s. Decoding it here, once, is what a browser would have
    // done for free if this had come from real markup instead of a
    // string.
    return src[1].replace(/&amp;/g, "&");
  } catch {
    return null;
  }
}

/** Every proof entry, with a real poster where one could be resolved. */
export async function getProofPosters(): Promise<ProofPoster[]> {
  return Promise.all(
    PROOF_CONTENT.map(async (entry) => {
      const platform = platformOf(entry);
      // An entry with a self-hosted `src` gets its poster from that same
      // file (a first-frame JPG generated alongside it, see
      // public/proof-videos/posters/) instead of the platform's own
      // oEmbed thumbnail — same-origin and permanent, where TikTok's/
      // Instagram's own CDN URLs are signed and expire (see
      // fetchTikTokPoster's own note) and can flash solid black in the
      // proof carousel if one fails to load right when the tile scrolls
      // into view. Skips the network round-trip entirely, not just the
      // failure mode.
      const thumbnail = entry.src
        ? `/proof-videos/posters/${entry.id}.jpg?v=${videoVersion(`/proof-videos/posters/${entry.id}.jpg`)}`
        : platform === "TikTok" && entry.postUrl
          ? await fetchTikTokPoster(entry.postUrl)
          : platform === "Instagram" && entry.postUrl
            ? await fetchInstagramPoster(entry.postUrl)
            : null;
      return {
        id: entry.id,
        thumbnail,
        // `?v=<mtime>` on the video src — these files have been replaced
        // in place at the same path more than once already (a blur pass,
        // then reverted), and a browser that fetched the old bytes at
        // that exact URL earlier in the same session has no reason to
        // ask again for a plain, unversioned path. Tying the version to
        // the file's own mtime means it updates automatically the next
        // time the file actually changes, rather than needing a manual
        // bump remembered every time.
        video: entry.src ? `${entry.src}?v=${videoVersion(entry.src)}` : undefined,
        views: entry.views,
        label: entry.label,
        postUrl: entry.postUrl,
        platform,
      };
    })
  );
}
