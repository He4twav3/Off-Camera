"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

type Platform = "tiktok" | "instagram";

function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("tiktok.com")) return "tiktok";
    if (host.endsWith("instagram.com")) return "instagram";
  } catch {
    // not a valid URL
  }
  return null;
}

function loadScript(src: string) {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  document.body.appendChild(script);
  return script;
}

const INSTAGRAM_EMBED_SCRIPT = "https://www.instagram.com/embed.js";
const TIKTOK_EMBED_SCRIPT = "https://www.tiktok.com/embed.js";

// TikTok's embed.js does NOT keep watching for blockquotes added after
// its first run (confirmed by testing: loading it once for card 1 never
// picked up card 2's blockquote at all) — so it genuinely has to be
// triggered again per new card. A fresh <script> tag (even reusing the
// same src) is the documented way to do that.
function ensureTiktokEmbedScript(): void {
  loadScript(TIKTOK_EMBED_SCRIPT);
}

/**
 * Renders the real video inline using the platform's own official public
 * embed widget — the same markup TikTok's/Instagram's own "Embed" share
 * option generates, not a scrape or a re-hosted copy. Real playback,
 * real account, real engagement counts, on their CDN.
 *
 * TikTok: resolved via their public oEmbed endpoint (CORS-enabled, no
 * auth) — necessary because share links like vt.tiktok.com/... don't
 * carry the numeric video id the embed widget needs; oEmbed resolves
 * that server-side. Their oEmbed response also hands back a real static
 * `thumbnail_url`, which is used as a click-to-play poster instead of
 * loading their live iframe immediately: once that iframe is live and
 * playing, whatever TikTok's own player shows after the clip ends
 * (related-video suggestions, etc.) is rendered *inside* their iframe,
 * cross-origin — this page's CSS/JS cannot reach in and strip that out,
 * that's the browser's same-origin sandboxing doing its job, not
 * something fixable from here. Gating it behind an explicit click means
 * nothing TikTok-controlled loads unless a visitor actually chooses to
 * watch, same pattern any "click to play" YouTube embed uses.
 *
 * Instagram: no API call needed — their embed.js resolves a permalink
 * client-side on its own (the classic "paste this blockquote" embed
 * code); its own default card is already a single-post view, not a
 * scrollable feed, so it loads immediately.
 *
 * Guaranteed to never leave a dead end: an unrecognized platform, or a
 * TikTok embed that fails after retries, returns null and relies on the
 * "Watch on ___" link proof-showcase.tsx renders alongside this. But
 * Instagram's embed can't be handled that way — unlike TikTok's oEmbed
 * fetch, there's no request whose failure we can observe; embed.js is a
 * fire-and-forget script that quietly does nothing if it's blocked (an
 * ad blocker, Safari/Brave's default third-party-cookie blocking, a
 * captive network) or just slow. proof-showcase.tsx also doesn't render
 * its own link for Instagram, on the assumption that a successful embed
 * already carries one in its own footer — true when it loads, but that
 * assumption is exactly what leaves a silently blank card with no way to
 * watch when it doesn't. So this component watches for its own embed to
 * actually appear and, failing that, renders a real "Watch on Instagram"
 * link itself (see the MutationObserver effect below) — it doesn't lean
 * on the parent for that the way TikTok/unrecognized-platform do.
 */
export function PlatformEmbed({ postUrl, className }: { postUrl: string; className?: string }) {
  const platform = detectPlatform(postUrl);

  const instagramHtml =
    platform === "instagram"
      ? `<blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14" style="margin:0;width:100%;"></blockquote>`
      : null;

  const [tiktokHtml, setTiktokHtml] = useState<string | null>(null);
  const [tiktokThumbnail, setTiktokThumbnail] = useState<string | null>(null);
  const [tiktokFailed, setTiktokFailed] = useState(false);
  const [tiktokClicked, setTiktokClicked] = useState(false);
  const [instagramFailed, setInstagramFailed] = useState(false);
  const instagramContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (platform !== "tiktok") return;
    let cancelled = false;

    function fetchOembed(): Promise<void> {
      // Our own server-side proxy (src/app/api/tiktok-oembed/route.ts),
      // not tiktok.com directly — same-origin, so this can never surface
      // as a CORS console error the way calling TikTok from the browser
      // occasionally did.
      return fetch(`/api/tiktok-oembed?url=${encodeURIComponent(postUrl)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data: { html?: string; thumbnail_url?: string }) => {
          if (cancelled) return;
          // Strip the trailing <script> the API response includes — a
          // <script> tag injected via dangerouslySetInnerHTML never
          // actually executes, so that script is loaded for real below
          // instead, only once the visitor clicks play.
          const blockquote = (data.html ?? "").replace(/<script[^>]*><\/script>\s*$/i, "");
          if (blockquote) {
            setTiktokHtml(blockquote);
            setTiktokThumbnail(data.thumbnail_url ?? null);
          } else {
            throw new Error("empty embed html");
          }
        });
    }

    function wait(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Small random stagger before the *first* attempt too, not just
    // retries — even going through our own /api/tiktok-oembed proxy
    // (which is what actually stops this from ever showing up as a
    // browser CORS console error, see that route's own comment),
    // TikTok's endpoint still occasionally rejects near-simultaneous
    // requests when multiple cards load on the same page, which reads
    // as ordinary rate-limiting rather than anything wrong with any one
    // request. Spreading requests out avoids triggering that in the
    // first place. Two retries with growing backoff on top of that —
    // only marked failed (falling back to the "Watch on ___" link) if
    // all three attempts fail.
    async function attemptWithRetries(): Promise<void> {
      await wait(Math.random() * 600);
      for (const delay of [0, 1200, 2500]) {
        if (delay > 0) await wait(delay);
        if (cancelled) return;
        try {
          await fetchOembed();
          return;
        } catch {
          // fall through to next attempt
        }
      }
      if (!cancelled) setTiktokFailed(true);
    }

    attemptWithRetries();

    return () => {
      cancelled = true;
    };
  }, [platform, postUrl]);

  // Instagram loads its embed immediately (no related-content risk to
  // gate against); TikTok's live iframe only mounts after a click.
  const html = platform === "instagram" ? instagramHtml : tiktokClicked ? tiktokHtml : null;

  useEffect(() => {
    if (!html) return;

    if (platform === "instagram") {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
        return;
      }
      const script = loadScript(INSTAGRAM_EMBED_SCRIPT);
      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
      };
    }

    // Singleton — see ensureTiktokEmbedScript's own note on why this
    // must never be reloaded per-click.
    ensureTiktokEmbedScript();
  }, [html, platform]);

  // Did the Instagram embed actually materialize? embed.js swaps the
  // blockquote for a real <iframe> when it succeeds; nothing in its API
  // reports back when it doesn't, so this watches the DOM directly
  // instead of trusting a promise or a callback that will never fire.
  //
  // A MutationObserver catches success as soon as it happens (typically
  // well under a second on a normal connection) rather than always
  // waiting out the timeout. The timeout is the actual failure signal:
  // generous headroom for a slow load, past which nothing appearing
  // means blocked, not loading — an ad blocker, third-party-cookie
  // restrictions, or a network that can't reach instagram.com at all.
  useEffect(() => {
    if (platform !== "instagram" || !html) return;
    const container = instagramContainerRef.current;
    if (!container) return;

    let resolved = false;
    const observer = new MutationObserver(() => {
      if (container.querySelector("iframe")) {
        resolved = true;
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      if (!resolved && !container.querySelector("iframe")) {
        setInstagramFailed(true);
      }
      observer.disconnect();
    }, 8000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [platform, html]);

  if (platform === null || (platform === "tiktok" && tiktokFailed)) return null;

  // Instagram's embed never materialized. Not "coming soon" — this is a
  // real, live post, the widget just didn't render — so the fallback
  // says that and gives a direct, working way to watch it, in the same
  // frame every other state on this page uses.
  if (platform === "instagram" && instagramFailed) {
    return (
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group flex aspect-9/16 flex-col items-center justify-center gap-3 rounded-sm border border-hairline bg-surface-2 p-6 text-center transition-colors duration-300 hover:bg-surface-3",
          className
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full border border-hairline text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          <ExternalLink className="size-5" strokeWidth={1.75} />
        </span>
        <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
          Preview blocked
        </span>
        <span className="text-sm font-semibold text-foreground">Watch on Instagram</span>
      </a>
    );
  }

  // TikTok, not yet clicked: a real static poster (their own thumbnail),
  // not their live player.
  if (platform === "tiktok" && !tiktokClicked) {
    if (!tiktokThumbnail) {
      return (
        <div
          className={cn(
            "flex aspect-9/16 items-center justify-center rounded-sm border border-hairline bg-surface-2 p-6 text-center font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase",
            className
          )}
        >
          Loading video
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setTiktokClicked(true)}
        aria-label="Load video"
        className={cn(
          "group relative isolate block aspect-9/16 overflow-hidden rounded-sm bg-surface-2",
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external TikTok CDN thumbnail from their own oEmbed response, not a local asset */}
        <img
          src={tiktokThumbnail}
          alt=""
          className="size-full object-cover"
          // The URL is a signed TikTok CDN link with its own expiry
          // (see the oEmbed fetch above) — it can go stale on a page
          // that's been open a while, and a hotlink can be blocked
          // outright. Either way the failure is silent: no fetch to
          // catch, just an <img> that never paints, leaving the tap
          // button floating over whatever is behind it (page background,
          // not a black void). Routing that into the same tiktokFailed
          // state the oEmbed fetch uses means it resolves the same way:
          // this component returns null and proof-showcase's own "Watch
          // on TikTok" link — which needsOwnWatchLink already renders
          // for every non-Instagram platform — becomes the fallback,
          // rather than a dead button sitting on nothing.
          onError={() => setTiktokFailed(true)}
        />
        {/* Edge scrim. These are real thumbnails from real videos, and a
            bright one (a screen recording, a white-background product shot) is a
            hard white rectangle punched into a very dark page. Darkening
            the outer edges settles it into the surface the way an inset
            photograph sits in a dark layout, without touching the middle
            of the frame where the actual content is. */}
        <span
          aria-hidden
          className="absolute inset-0 shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.35),inset_0_0_46px_14px_oklch(0_0_0_/_0.45)]"
        />
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/15 transition-colors duration-500 group-hover:bg-black/30">
          <span className="flex size-14 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition-transform duration-500 ease-[var(--ease-cinematic)] group-hover:scale-105">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
          <span className="rounded-full bg-black/45 px-3 py-1 font-mono text-[0.65rem] tracking-[0.12em] text-white uppercase backdrop-blur">
            Tap to load
          </span>
        </span>
      </button>
    );
  }

  if (!html) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-sm border border-hairline bg-surface-2 p-6 text-center font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase",
          className
        )}
      >
        Loading video…
      </div>
    );
  }

  return (
    <div>
      <div
        // Only load-bearing for Instagram (see the MutationObserver
        // effect above), but harmless to attach for TikTok too — one
        // ref rather than conditionally forking this whole return.
        ref={instagramContainerRef}
        className={cn(
          // Only slightly rounded, every state this file renders — real
          // video, on either platform, reads as only slightly rounded
          // (this matches what Instagram's own embed does), never the
          // heavier rounding a decorative card wants. VideoPlayer's
          // "premium" frame uses the same value for the same reason.
          "relative overflow-hidden rounded-sm border border-hairline bg-surface-2",
          // TikTok's player IS the video: a 9:16 rectangle with no chrome
          // around it, so it can be pinned to fill a 9:16 frame and it
          // looks exactly right.
          //
          // Instagram's embed is NOT just the video. It ships a header
          // (avatar, handle, "View profile"), the media, then a footer
          // ("view more on Instagram", likes, caption) — a card that is
          // substantially taller than 9:16 and whose height depends on
          // the caption. Forcing that into a 9:16 box with `!size-full`
          // is what produced the visibly broken card here: the header
          // clipped mid-word at the top and the footer sliced off at the
          // bottom. It gets its natural height instead, and the column
          // it sits in absorbs the difference.
          platform === "tiktok"
            ? [
                "aspect-9/16",
                "[&_iframe]:!absolute [&_iframe]:!inset-0 [&_iframe]:!size-full [&_iframe]:!border-0",
                "[&_blockquote]:!m-0 [&_blockquote]:!size-full [&_blockquote]:!max-w-none [&_blockquote]:!min-w-0",
              ]
            : // Instagram's blockquote is an empty element until their
              // embed.js swaps it for the real iframe, so it has zero
              // intrinsic height — without a reserved height the media
              // column collapses to a hairline and the card renders with
              // a hole where the video should be (and the page reflows by
              // ~600px the moment the script lands). min-h reserves a
              // realistic single-post height; the real card grows past it
              // if the caption needs more.
              "min-h-[34rem] [&_blockquote]:!m-0 [&_blockquote]:!w-full [&_blockquote]:!max-w-none [&_blockquote]:!min-w-0 [&_iframe]:!w-full [&_iframe]:!min-w-0",
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {platform === "tiktok" && (
        // TikTok's own player needs its own tap to actually start
        // playback — no technique gets around that (tested directly:
        // even a genuine synchronous click building the iframe with
        // autoplay params doesn't autoplay, TikTok's player requires the
        // explicit tap regardless). This says so plainly instead of
        // leaving a second unexplained click as the only signal.
        <p className="mt-2.5 text-center font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
          Tap the video above to play it
        </p>
      )}
    </div>
  );
}
