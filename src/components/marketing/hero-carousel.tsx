"use client";

import { useEffect, useRef, useState } from "react";
import type { ProofPoster } from "@/lib/proof-thumbnails";
import { cn } from "@/lib/utils";

/**
 * The hero's 3D ring carousel — a true CSS 3D cylinder, ported from a
 * working vanilla prototype rather than re-derived from a screenshot
 * (the lesson from an earlier, now-deleted attempt at this same curve —
 * `proof-wall.tsx`'s `CurvedReel`, a hand-computed approximation:
 * guessing a curve's shape from how it *looks* in a still image gets
 * the shape wrong twice before it's worth admitting the shape should
 * have been measured or handed over, not guessed. This is the ring that
 * replaced it, and the only proof carousel on the page now).
 *
 * THE TECHNIQUE. `STAGE` sets `perspective`; `RING` sits inside it with
 * `transform-style: preserve-3d` and is the *only* thing that ever
 * animates — one CSS keyframe, `rotateY(0) -> rotateY(-360deg)`, linear,
 * infinite (globals.css's `animate-hero-ring`). Every card's own
 * transform is fixed forever at `rotateY(angle) translateZ(radius)`,
 * `angle = (360 / N) * index` — evenly spaced around a circle. Nothing
 * here computes a per-card scale, rotation or depth: the browser's own
 * perspective projection does every bit of the "front card largest and
 * flattest, cards toward the sides smaller and more angled" foreshortening
 * automatically, because that is what a camera looking at a real rotating
 * cylinder actually does. That is the whole reason this reads as exact
 * where two earlier hand-computed attempts didn't — it isn't a curve
 * fitted to match one, it's the same 3D scene.
 *
 * CONTENT: real videos, not filler. Only 5 real proof clips exist, and
 * the prototype's N=16 density assumed generic filler — so instead of
 * either inventing 11 fake cards or leaving big gaps between 5 real
 * ones, the 5 repeat 3x (N=15, evenly).
 *
 * PLAYBACK: every card, always. An earlier version here gated playback
 * by angle from front-centre (reading the ring's own animation timeline
 * to decide which handful of cards were "close enough" to bother
 * playing), on the theory that 15 simultaneous `<video autoPlay>`
 * elements would hit a browser's concurrent-decode cap. In practice that
 * gate itself was the bug — several cards sat frozen on their poster
 * frame because the trigger wasn't reliably firing as the ring turned,
 * which is strictly worse than the problem it was meant to prevent.
 * Plain `autoPlay` on every card is simpler and, with only 5 short
 * portrait clips (times 3 for density — 15 elements, not 15 distinct
 * decodes' worth of unique footage), holds up fine. Revisit with an
 * angle-based gate again only if this measurably struggles, not
 * pre-emptively.
 *
 * MOBILE: not the same scene shrunk. A perspective/radius/card-size
 * tuned for a wide screen produces cards running off both edges on a
 * phone if the whole thing is just scaled down — the fix here is a
 * completely different, flat, horizontally-snapping row below `md`
 * (see `MobileRow`), not a smaller version of the cylinder.
 */

const N_COPIES = 3;
const RADIUS = 560;
const CARD_WIDTH = 200;
const CARD_HEIGHT = 360;
const PERSPECTIVE = 1600;

function CarouselCard({
  poster,
  angle,
  setVideoRef,
}: {
  poster: ProofPoster;
  angle: number;
  setVideoRef: (node: HTMLVideoElement | null) => void;
}) {
  return (
    <a
      href={poster.postUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${poster.label}${poster.views ? `, ${poster.views} views` : ""} — watch on ${poster.platform ?? "the original post"}`}
      className="focus-premium absolute top-1/2 left-1/2 block overflow-hidden rounded-[22px] bg-surface-2 shadow-[0_20px_40px_-8px_oklch(0_0_0_/_0.4)]"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginLeft: -CARD_WIDTH / 2,
        marginTop: -CARD_HEIGHT / 2,
        transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        willChange: "transform",
      }}
    >
      {poster.video ? (
        <video
          ref={setVideoRef}
          src={poster.video}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={poster.thumbnail ?? undefined}
          className="size-full object-cover"
        />
      ) : poster.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element -- resolved poster URL, not a local asset
        <img src={poster.thumbnail} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-b from-surface-3 to-surface-1 text-sm text-muted-foreground">
          {poster.views ?? poster.label}
        </div>
      )}
      <span aria-hidden className="absolute inset-0 shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.08)]" />
    </a>
  );
}

/** Below `md`, a flat horizontally-snapping row instead of the 3D
 * cylinder — see the header note on why this is a different layout, not
 * a shrunk one. Autoplay is gated by actual on-screen visibility
 * (IntersectionObserver) rather than an angle, since there's no ring
 * rotation to compute one from here. */
function MobileRow({ posters }: { posters: ProofPoster[] }) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }
      },
      { threshold: 0.6 }
    );
    for (const video of videoRefs.current) if (video) io.observe(video);
    return () => io.disconnect();
  }, [posters]);

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {posters.map((poster, i) => (
        <a
          key={poster.id}
          href={poster.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-premium relative block aspect-[5/9] w-[62vw] shrink-0 snap-center overflow-hidden rounded-[22px] bg-surface-2 shadow-[0_20px_40px_-8px_oklch(0_0_0_/_0.4)] first:ml-[19vw] last:mr-[19vw]"
        >
          {poster.video ? (
            <video
              ref={(node) => {
                videoRefs.current[i] = node;
              }}
              src={poster.video}
              muted
              loop
              playsInline
              preload="metadata"
              poster={poster.thumbnail ?? undefined}
              className="size-full object-cover"
            />
          ) : poster.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- resolved poster URL, not a local asset
            <img src={poster.thumbnail} alt="" className="size-full object-cover" draggable={false} />
          ) : null}
        </a>
      ))}
    </div>
  );
}

export function HeroCarousel({
  posters,
  className,
  children,
}: {
  posters: ProofPoster[];
  className?: string;
  /** The CTA cluster, absolutely centred over the ring — see hero.tsx. */
  children?: React.ReactNode;
}) {
  const ringRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  // Real, playable video only — an entry with just a resolved thumbnail
  // (no self-hosted `src` yet) has nowhere else to be shown now that
  // this is the page's only proof carousel, but a ring built to be
  // *watched* spinning still shouldn't mix static images in among
  // playing video. This also keeps N tied to how many clips are
  // actually shown, not to however many entries proof-content.ts
  // happens to have at a given moment — PROOF_CONTENT has grown since
  // this ring's radius/spacing were tuned, and a mismatched N (more
  // cards than the geometry was tuned for) is what previously produced
  // overlapping, uneven-looking spacing, not a bug in the angle math
  // itself (verified: every card's angle is a clean `(360 / N) * index`,
  // and every card box is a fixed 200x360 CSS size regardless of its
  // source clip's own dimensions).
  const videoPosters = posters.filter((p) => p.video);
  const n = videoPosters.length;
  const total = n * N_COPIES;
  const items = Array.from({ length: total }, (_, i) => videoPosters[i % n]);
  const stepDeg = total > 0 ? 360 / total : 0;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Reduced motion: nothing to drive playback with a per-frame loop for
  // any more (see the header note — every card just autoplays now), but
  // the ring itself still needs to be told to actually start each video,
  // since the CSS animation being disabled (motion-reduce:animate-none)
  // doesn't affect `autoPlay` one way or the other — this only matters
  // for browsers that don't honour `autoPlay` until a layout/visibility
  // signal fires, which reduced-motion's static layout can suppress.
  useEffect(() => {
    if (!reduced) return;
    for (const video of videoRefs.current) video?.play().catch(() => {});
  }, [reduced]);

  if (n === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        className="relative mx-auto hidden h-[420px] w-full max-w-[1100px] md:block"
        style={{ perspective: PERSPECTIVE }}
      >
        <div
          ref={ringRef}
          className={cn(
            "animate-hero-ring absolute inset-0 [transform-style:preserve-3d] will-change-transform",
            "motion-reduce:animate-none hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
          )}
        >
          {items.map((poster, i) => (
            <CarouselCard
              key={`${poster.id}-${i}`}
              poster={poster}
              angle={i * stepDeg}
              setVideoRef={(node) => {
                videoRefs.current[i] = node;
              }}
            />
          ))}
        </div>
        {/* The CTA cluster, centred over the ring and above it in
            stacking order — z-index isn't needed for a preserve-3d
            sibling that isn't itself in the 3D context, but it's still
            the frontmost thing a visitor's cursor can reach, which is
            what actually matters here. */}
        {children && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
            <div className="pointer-events-auto flex flex-col items-center gap-4">{children}</div>
          </div>
        )}
      </div>

      <MobileRow posters={videoPosters} />
    </div>
  );
}
