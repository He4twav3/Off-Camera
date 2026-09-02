"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * `transform-style: preserve-3d`. Every card's own transform is fixed
 * forever at `rotateY(angle) translateZ(radius)`, `angle = (360 / N) *
 * index` — evenly spaced around a circle. Nothing here computes a
 * per-card scale, rotation or depth: the browser's own perspective
 * projection does every bit of the "front card largest and flattest,
 * cards toward the sides smaller and more angled" foreshortening
 * automatically, because that is what a camera looking at a real
 * rotating cylinder actually does. That is the whole reason this reads
 * as exact where two earlier hand-computed attempts didn't — it isn't a
 * curve fitted to match one, it's the same 3D scene.
 *
 * THE SPIN, ported from proof-wall.tsx. What drives the ring's `rotateY`
 * is a pointer drag (or a trackpad's horizontal wheel), not a CSS
 * keyframe — same damped-glide feel that component had:
 *
 *   Nothing moves on its own. No auto-advance, no drift. The ring sits
 *   still until someone actually grabs and turns it.
 *
 *   Damped, not direct. `position` doesn't jump straight to `target`;
 *   every frame it closes a fraction (DAMPING) of the remaining gap, so
 *   the ring trails slightly behind the gesture and glides to rest
 *   afterward, carrying whatever speed the release had (the `velocity`
 *   carried into `endDrag` — a fast flick keeps it spinning).
 *
 *   No clamp, no snap. Unlike proof-wall's finite panorama (bounded by
 *   how much real content there was left to reveal), this is a closed
 *   ring — there's no edge to run out of, so `target` is free to grow or
 *   shrink without limit and the loop never needs to stop it.
 *
 * It's driven by Pointer Events, not separate mouse/touch handlers, so
 * this same drag-and-fling already works with a finger, not just a
 * mouse — `onPointerDown`/`Move`/`Up` fire uniformly for mouse, touch
 * and pen. That's what makes ONE_RING (below) possible at all: nothing
 * about the interaction itself is desktop-only, only the geometry used
 * to be (see ONE_RING's own note).
 *
 * ONE_RING: same cylinder at every width, not a phone-only fallback.
 * This used to swap to a completely different, flat, horizontally-
 * snapping row below the `md` breakpoint (`MobileRow`, now deleted) —
 * reasoned as "a perspective/radius/card-size tuned for a wide screen
 * produces cards running off both edges on a phone if the whole thing
 * is just scaled down". True, but the fix for that is scaling it down
 * *correctly*, not abandoning the ring: `cardWidth`/`cardHeight`/
 * `radius`/`perspective`/`stageHeight` (`ringGeometry`) are all derived
 * from the stage's own measured width (`useMeasuredWidth`, ResizeObserver-
 * driven, same measurement pattern proof-wall.tsx used for its panorama)
 * via fixed ratios off `CARD_WIDTH_DESKTOP`, clamped on both ends so a
 * card never grows past its tuned desktop size or shrinks past legible
 * (`CARD_WIDTH_MIN`) — see each ratio constant's own note for what it
 * controls and why its current value is what it is.
 *
 * CONTENT: real, real-numbered proof — not "has a video file". The ring
 * shows every entry that carries an actual, given view count (see
 * `ringPosters` below), currently 5, ranging roughly 1M to 15M: two of
 * those (flagship-a, no-talking) have a self-hosted clip and autoplay
 * as real video; the other three (flagship-b/c/d) don't and render as
 * static tiles instead — a real number on a still frame beats no card
 * at all, and beats inventing a number just to unlock video treatment.
 * The prototype's N=16 density assumed generic filler, so instead of
 * either inventing 11 fake cards or leaving big gaps between 5 real
 * ones, the 5 repeat 3x (N=15, evenly). `n`/`total` below are computed
 * from however many qualify at a given moment, not hardcoded — this
 * comment just names the current count for context.
 *
 * THE VIEW COUNT: on the card, same as proof-wall.tsx's ProofTile had it
 * — a number attached to the video it measures is evidence; the same
 * number floating in a panel somewhere else on the page is a claim. It's
 * also the actual selection criterion above, not just a decoration: an
 * entry with no real number doesn't earn a spot on this ring at all.
 *
 * PLAYBACK: only the video card(s) within `ACTIVE_WINDOW_DEG` of
 * front-centre actually play; every other video-bearing card sits
 * paused on its poster frame until the ring brings it back around. A
 * static rotateY keyframe used to make this ungatable — an earlier
 * attempt read the CSS animation's own computed timeline to guess which
 * cards were "close enough," and the trigger firing unreliably left
 * several cards frozen, which was strictly worse than not gating at
 * all. That constraint is gone now that rotation is driven by this same
 * component's own rAF loop (`updatePlayback`, called every frame
 * alongside the transform write): `position.current` IS the ring's
 * exact angle, not something to be read back off a browser's animation
 * timeline, so the gate is exact and cheap rather than approximate and
 * fragile. With the two unique video clips landing ~120° apart around
 * the ring (5 unique posters × 24°/step) and a ~40° active window, at
 * most one is ever playing at once — down from up to 6 simultaneous
 * `<video>` decodes (2 clips × 3 copies each) under plain `autoPlay`,
 * which is real, felt cost on a phone GPU even for short clips. Static
 * (non-video) cards never enter this at all — nothing to gate.
 */

const N_COPIES = 3;

/** Desktop reference card width. Every other size (radius, perspective,
 * stage height) is a ratio of whatever the current card width is — see
 * `ringGeometry` below — so this one number scales the entire scene.
 * Down from the original prototype's 200: the whole scene (this,
 * radius, perspective, stage height, all proportional) shrinks with it,
 * which is the one lever available here to bring the stage's total
 * footprint down without touching hero.tsx's own headline/spacing. */
const CARD_WIDTH_DESKTOP = 175;

/** Portrait video aspect ratio (5:9, matching every clip these actually
 * are) — a fixed literal, NOT `360 / CARD_WIDTH_DESKTOP`. That formula
 * was a real bug: it happened to equal the right ratio (1.8) only back
 * when CARD_WIDTH_DESKTOP was still 200 (360/200), and silently broke
 * — cardHeight = cardWidth * (360/CARD_WIDTH_DESKTOP) cancels cardWidth
 * out of its own formula entirely, so every card rendered at a flat
 * 360px tall no matter its width — the moment CARD_WIDTH_DESKTOP became
 * a tuning knob in its own right (see its own note) instead of a
 * constant nothing else depended on. */
const HEIGHT_RATIO = 1.8;

/** RADIUS_RATIO and PERSPECTIVE_RATIO together set the front card's
 * magnification as it swings through front-centre: perspective /
 * (perspective - radius). The original values ported straight from the
 * vanilla prototype (560/200=2.8 and 1600/200=8) produced a dramatic
 * ~1.54x — striking, but tall enough at its magnified size that
 * containing it without cropping (see STAGE_HEIGHT_RATIO) pushed the
 * whole hero noticeably further down the page, past the fold on an
 * ordinary laptop screen, which read as the view count being "cut" even
 * though nothing was actually clipping it any more by that point.
 * Toned down to ~1.33x here (10/(10-2.5)) — still a clearly-larger
 * front card, just not one that needs so much extra headroom to fit.
 * RADIUS_RATIO dropping from 2.8 to 2.5 costs a little spacing between
 * cards at rest, but at 15 cards evenly spaced this still leaves each
 * one a full card-width of arc between it and its neighbour (2π × 2.5 /
 * 15 ≈ 1.05, i.e. > 1.0), so nothing overlaps. */
const RADIUS_RATIO = 2.5;
const PERSPECTIVE_RATIO = 10;

/** Tall enough to fully contain the front card at its *magnified* size,
 * not its nominal CSS one (magnification factor — see RADIUS_RATIO/
 * PERSPECTIVE_RATIO's own note — is 10/(10-2.5) ≈ 1.333x): a stage sized
 * to the card's own unscaled height crops that scaled-up card's caption
 * off its top and its view count off its bottom every time it rotates
 * through front-centre. 2.55 clears 1.8 (HEIGHT_RATIO) × 1.333 ≈ 2.4
 * with a small margin for the card's own drop shadow, which is part of
 * the same transformed, magnified element. The stage now genuinely
 * contains the ring — see the `overflow-hidden` on it below — instead
 * of relying on an ancestor that happens not to clip. */
const STAGE_HEIGHT_RATIO = 2.55;

/** Never smaller than this — below it a card's caption and view count
 * stop being comfortably legible on a phone. Down from 150: the CTA
 * cluster moved out of the ring and into normal page flow above it (see
 * hero.tsx), so the ring is no longer also asked to host and stay
 * legible under a button and two lines of caption text at the same
 * time — it can afford to run smaller now that its only job is showing
 * the videos. */
const CARD_WIDTH_MIN = 110;

/** How much of the stage's own measured width one card claims. Tuned so
 * the front card reads as clearly the main thing (not a sliver) while
 * still leaving its neighbours visibly peeking in on a narrow phone.
 * Down from 0.42 for the same reason as CARD_WIDTH_MIN above — a
 * smaller fraction is what actually makes a phone-width stage compute a
 * smaller card; CARD_WIDTH_MIN alone only sets the floor, and at 0.42 a
 * typical ~390px phone stage (390*0.42≈164) never reached that floor in
 * the first place. Desktop is unaffected either way — the stage's own
 * max-w-[1100px] means `width * 0.32` clamps to CARD_WIDTH_DESKTOP long
 * before it would land anywhere close to it. */
const CARD_WIDTH_FRACTION = 0.32;

/** How much of the remaining distance the ring closes each frame toward
 * its target rotation. Low enough to trail the finger/flick noticeably;
 * high enough it never feels like it's fighting you — the exact constant
 * proof-wall.tsx used for its own damped glide. */
const DAMPING = 0.085;

/** Below this the ring is at rest and the loop parks itself rather than
 * spinning forever on sub-pixel rotation. */
const REST_EPSILON = 0.0005;

/** Degrees of ring rotation per pixel of drag, AT THE DESKTOP CARD SIZE
 * — exactly the original tuned value, unchanged, so desktop's own feel
 * is untouched. Never used directly; see `degPerPx()` below for what
 * actually reads this. */
const DEG_PER_PX_DESKTOP = 0.12;

/** The real, size-aware sensitivity: `DEG_PER_PX_DESKTOP` scaled by how
 * much smaller the current card is than the desktop one.
 *
 * A FIXED px-to-degree ratio (what this was before) is exactly what
 * made a phone harder to swipe than a desktop, not the same: a phone
 * doesn't have desktop's screen width to drag across, so the same fixed
 * ratio applied to a much shorter physically-possible drag produces
 * proportionally less rotation — "swipe edge to edge" on a 390px phone
 * moved the ring maybe half as far as the same gesture did at desktop
 * width, for the same amount of physical effort.
 *
 * `DEG_PER_PX_DESKTOP * (CARD_WIDTH_DESKTOP / cardWidth)` is exactly
 * `DEG_PER_PX_DESKTOP` when `cardWidth` IS `CARD_WIDTH_DESKTOP` — zero
 * change to desktop's own sensitivity, which is the whole point — and
 * grows inversely as the card shrinks on a phone, so a drag covering
 * the same *fraction* of the (smaller) available width produces the
 * same rotation desktop's own drag would have. That's the actual
 * invariant worth matching: not "N pixels turns the ring X degrees"
 * (that's what made mobile feel stiffer), but "swiping across this much
 * of the visible ring turns it the same amount, at any size." */
function degPerPx(cardWidth: number): number {
  return DEG_PER_PX_DESKTOP * (CARD_WIDTH_DESKTOP / cardWidth);
}

/** Drag distance, px, past which a pointer-up is a swipe and not a
 * click. Below it the card's link opens as normal. */
const CLICK_SLOP = 8;

/** How close to dead-centre (degrees either side) a video-bearing card
 * has to swing before its `<video>` actually plays — see PLAYBACK in
 * the header note. Wide enough that playback has already started by
 * the time a card reaches exact front-centre (no visible pop-in), tight
 * enough that two unique clips spaced ~120° apart around this ring are
 * essentially never both inside the window at once. */
const ACTIVE_WINDOW_DEG = 40;

/** Measures an element's own rendered width and stays current across
 * resizes (orientation change, window resize, a devtools panel opening)
 * — same ResizeObserver pattern proof-wall.tsx used to size its
 * panorama's tiles off the real stage, not a breakpoint guess. */
function useMeasuredWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

type RingGeometry = {
  cardWidth: number;
  cardHeight: number;
  radius: number;
  perspective: number;
  stageHeight: number;
};

/** Derives every size in the scene from one measured number — the
 * stage's own rendered width — via the fixed ratios in the header note.
 * `width` of 0 (not measured yet, first paint) falls back to the old
 * desktop constants so nothing renders at zero size for a frame. */
function ringGeometry(width: number): RingGeometry {
  // Clamped on both ends: MIN so a card never shrinks past legible on a
  // phone, CARD_WIDTH_DESKTOP so it never grows *past* the original
  // tuned desktop size either — width * CARD_WIDTH_FRACTION alone is
  // unbounded above, and the stage's own max-w-[1100px] means measured
  // width can exceed the ~476px (200 / 0.42) where the fraction would
  // naturally land on 200 anyway, so wide desktops need the ceiling
  // just as much as narrow phones need the floor.
  const cardWidth =
    width > 0
      ? Math.min(Math.max(width * CARD_WIDTH_FRACTION, CARD_WIDTH_MIN), CARD_WIDTH_DESKTOP)
      : CARD_WIDTH_DESKTOP;
  return {
    cardWidth,
    cardHeight: cardWidth * HEIGHT_RATIO,
    radius: cardWidth * RADIUS_RATIO,
    perspective: cardWidth * PERSPECTIVE_RATIO,
    stageHeight: cardWidth * STAGE_HEIGHT_RATIO,
  };
}

/** The view count, on the tile it belongs to — ported from proof-wall's
 * ProofTile. A view count attached to the video it measures is evidence;
 * the same number floating in a panel elsewhere on the page is a claim. */
function ViewCount({ views }: { views?: string }) {
  if (!views) return null;
  return (
    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,oklch(0_0_0_/_0.9)_0%,oklch(0_0_0_/_0.45)_60%,transparent_100%)] px-3 pt-10 pb-3 text-center sm:px-4 sm:pb-4">
      <span className="text-lit block text-lg leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-2xl">
        {views}
      </span>
      <span className="mt-1.5 block font-mono text-[9px] tracking-[0.14em] text-white/60 uppercase sm:text-[10px]">
        views
      </span>
    </span>
  );
}

function CarouselCard({
  poster,
  angle,
  geometry,
  totalMoved,
  setVideoRef,
}: {
  poster: ProofPoster;
  angle: number;
  geometry: RingGeometry;
  /** Ref holding how far the current gesture has moved, in px — read at
   * click time to tell a swipe from a tap. Shared across every card
   * rather than one per card since only one drag can be in flight. */
  totalMoved: React.RefObject<number>;
  setVideoRef: (node: HTMLVideoElement | null) => void;
}) {
  const { cardWidth, cardHeight, radius } = geometry;
  return (
    <a
      href={poster.postUrl}
      target="_blank"
      rel="noopener noreferrer"
      // A drag must never navigate — same CLICK_SLOP guard proof-wall
      // used. The threshold is deliberately small: anything the user
      // would call a tap stays a tap.
      onClick={(event) => {
        if (totalMoved.current > CLICK_SLOP) event.preventDefault();
      }}
      draggable={false}
      aria-label={`${poster.label}${poster.views ? `, ${poster.views} views` : ""} — watch on ${poster.platform ?? "the original post"}`}
      className="focus-premium absolute top-1/2 left-1/2 block overflow-hidden rounded-[22px] bg-surface-2 shadow-[0_20px_40px_-8px_oklch(0_0_0_/_0.4)]"
      style={{
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        marginTop: -cardHeight / 2,
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        // No will-change here (see the header note on why only the ring
        // itself gets one) — a card's own transform is fixed forever;
        // promoting all 15 of them to their own compositor layer spends
        // real GPU memory for content that never actually animates on
        // its own, which a phone GPU feels a lot more than a desktop one
        // does.
      }}
    >
      {poster.video ? (
        <video
          ref={setVideoRef}
          src={poster.video}
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
      {/* The sheen. Cards range from real photographic video down to a
          flat white screenshot with black text on it — nothing in
          common tonally, so side by side in the same ring the
          screenshots read as flat stickers pasted next to cards with
          real depth in them. This is pure luminance, not colour — a
          soft light-from-upper-left highlight fading to a soft shadow
          at the lower-right, in plain black/white at low opacity, the
          same oklch(0/1 0 0 / alpha) vocabulary the hairline and drop
          shadow just below already use. It reads as glass/light hitting
          a curved surface regardless of what's underneath, which is
          what actually unifies a photo and a flat screenshot into "the
          same kind of card" — and because it never touches hue, it
          can't fight the page's own graphite/crimson palette the way an
          actual tint overlay would. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,oklch(1_0_0_/_0.16)_0%,transparent_30%,transparent_68%,oklch(0_0_0_/_0.28)_100%)]"
      />
      <span aria-hidden className="absolute inset-0 shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.08)]" />
      <ViewCount views={poster.views} />
    </a>
  );
}

export function HeroCarousel({
  posters,
  className,
}: {
  posters: ProofPoster[];
  className?: string;
}) {
  const [stageRef, stageWidth] = useMeasuredWidth<HTMLDivElement>();
  const ringRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [reduced, setReduced] = useState(false);

  const geometry = ringGeometry(stageWidth);

  // Kept fresh every render, same reason itemsRef/stepDegRef further
  // down are: the wheel effect below only re-runs when its own deps
  // change (kick/stageRef), not on every resize-driven geometry change,
  // so reading `geometry.cardWidth` directly inside it would
  // close over whatever card width happened to be current the one time
  // that effect last ran — usually mount, i.e. permanently stale the
  // moment the viewport is ever resized. onPointerMove doesn't need this
  // (it's a plain function redefined every render, not inside an
  // effect), only the wheel listener does.
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;

  // The ring's rotation, in degrees. `target` is where it's heading,
  // `position` is where it currently is — the gap between them is the
  // glide. Refs, not state: these change every frame during a drag, and
  // a re-render per frame would be pointless work fighting the same-
  // frame transform write for the main thread. Same split proof-wall
  // used for its own position/target.
  const target = useRef(0);
  const position = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const totalMoved = useRef(0);

  // Entries with a real, given view count only — not "has a self-hosted
  // video file". Some of these (flagship-a, no-talking) have one and
  // autoplay as real video; the rest (flagship-b/c/d) fall back to their
  // resolved poster image (see CarouselCard's own thumbnail branch) and
  // sit in the ring as static tiles instead. Deliberately mixed, not a
  // compromise: the point of this filter is "a number this page can
  // actually stand behind is on the card", not "the file happens to be
  // self-hosted" — an entry with no real number attached (like
  // flagship-f right now) has nowhere else to be shown until one exists,
  // same as PRODUCT_VISION.md §17 already governs everywhere else on the
  // page: never invent a stat.
  //
  // This also keeps N tied to how many clips are actually shown, not to
  // however many entries proof-content.ts happens to have at a given
  // moment — a mismatched N (more cards than the geometry was tuned for)
  // is what previously produced overlapping, uneven-looking spacing, not
  // a bug in the angle math itself (verified: every card's angle is a
  // clean `(360 / N) * index`, and every card box is a fixed size
  // regardless of its source clip's own dimensions).
  const ringPosters = posters.filter((p) => p.views);
  const n = ringPosters.length;
  const total = n * N_COPIES;
  const items = Array.from({ length: total }, (_, i) => ringPosters[i % n]);
  const stepDeg = total > 0 ? 360 / total : 0;

  // Kept fresh every render so `updatePlayback` — defined once, inside
  // the same empty-dep effect as the glide loop below, for the same
  // self-reference reason that loop is — never reads a stale `items`/
  // `stepDeg` from whatever render happened to be current when that
  // effect first ran.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const stepDegRef = useRef(stepDeg);
  stepDegRef.current = stepDeg;

  // Which card indices currently have their video actually playing —
  // compared against on every playback check so a `<video>` only ever
  // gets a real `.play()`/`.pause()` call on an actual transition, not
  // once a frame for the whole time it's already sitting in the state
  // it's supposed to be in.
  const activePlayback = useRef<Set<number>>(new Set());

  /** See PLAYBACK in the header note. Reads `position.current` directly
   * — the ring's exact current angle, not an approximation of one —
   * and plays/pauses whichever video-bearing cards just crossed into or
   * out of the front-centre window. Stable identity (empty deps, refs
   * only) so the glide loop below can call it every frame without
   * needing to be in that effect's own dependency array. */
  const updatePlayback = useCallback(() => {
    const items = itemsRef.current;
    const stepDeg = stepDegRef.current;
    const next = new Set<number>();
    for (let i = 0; i < items.length; i++) {
      if (!items[i]?.video) continue;
      const raw = (((i * stepDeg + position.current) % 360) + 360) % 360;
      const distanceFromFront = Math.min(raw, 360 - raw);
      if (distanceFromFront <= ACTIVE_WINDOW_DEG) next.add(i);
    }
    for (const i of next) {
      if (!activePlayback.current.has(i)) videoRefs.current[i]?.play().catch(() => {});
    }
    for (const i of activePlayback.current) {
      if (!next.has(i)) videoRefs.current[i]?.pause();
    }
    activePlayback.current = next;
  }, []);

  // Sets the correct initial playing card(s) on mount (and again if the
  // ring's own contents ever change) — without this, nothing would
  // start playing at all until the first drag, since `updatePlayback`
  // otherwise only runs from inside the glide loop below.
  useEffect(() => {
    updatePlayback();
  }, [updatePlayback, n]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Reduced motion: the ring itself can still be dragged either way
  // (see endDrag's own note on why that's no longer gated on `reduced`)
  // — what's actually true here is just that it never moves *on its
  // own*, same as always, so a visitor who hasn't touched it yet is
  // still looking at the exact mount-time position `updatePlayback`'s
  // earlier call already evaluated. This effect exists only because a
  // static layout can suppress the signal some browsers wait for before
  // honouring a programmatic `.play()`, so the one card already inside
  // the window needs telling again once reduced-motion is known for
  // certain.
  useEffect(() => {
    if (!reduced) return;
    updatePlayback();
  }, [reduced, updatePlayback]);

  /**
   * The glide.
   *
   * Lives inside an effect rather than a self-scheduling useCallback —
   * same reasoning as proof-wall's own `kick`/loop split: a self-
   * referencing callback is a lint error and a real footgun, since any
   * identity change would leave a frame already queued against the
   * previous closure. Scoped here, the loop, its running flag and its
   * handle are one unit the cleanup can cancel completely.
   */
  const kickRef = useRef<() => void>(() => {});
  useEffect(() => {
    let handle = 0;
    let live = false;

    function loop() {
      const gap = target.current - position.current;
      position.current += gap * DAMPING;
      velocity.current = gap * DAMPING;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotateY(${position.current}deg)`;
      }
      updatePlayback();

      if (Math.abs(gap) < REST_EPSILON) {
        // Close enough. Land exactly on target and park — an idle ring
        // should cost nothing at all.
        position.current = target.current;
        if (ringRef.current) {
          ringRef.current.style.transform = `rotateY(${position.current}deg)`;
        }
        updatePlayback();
        live = false;
        return;
      }
      handle = requestAnimationFrame(loop);
    }

    kickRef.current = () => {
      if (live) return;
      live = true;
      handle = requestAnimationFrame(loop);
    };

    return () => {
      cancelAnimationFrame(handle);
      live = false;
    };
  }, []);

  const kick = useCallback(() => kickRef.current(), []);

  /**
   * Trackpad and wheel, alongside the drag — same rationale as
   * proof-wall: a horizontal two-finger swipe on a trackpad is how most
   * desktop users expect to move something laid out sideways, and
   * vertical wheel input is deliberately left alone and handed straight
   * to the page rather than hijacked.
   *
   * Attached here rather than as an onWheel prop because the handler has
   * to call preventDefault, and React attaches wheel listeners passively
   * — inside a passive listener preventDefault does nothing (and logs a
   * console warning about it).
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      // Minus, not plus — opposite sign from the drag handler below.
      // Same inversion proof-wall's own wheel handler needed against its
      // drag: a trackpad swipe is a drag with no finger on the glass,
      // but deltaX's sign convention runs the other way from a pointer
      // move's.
      target.current -= event.deltaX * degPerPx(geometryRef.current.cardWidth);
      kick();
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [kick, stageRef]);

  function onPointerDown(event: React.PointerEvent) {
    dragging.current = true;
    lastX.current = event.clientX;
    totalMoved.current = 0;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragging.current) return;
    const delta = event.clientX - lastX.current;
    lastX.current = event.clientX;
    totalMoved.current += Math.abs(delta);
    // `geometry` directly, not geometryRef — this is a plain function
    // redefined every render (unlike the wheel handler above, which
    // lives inside a useEffect that doesn't re-run on every geometry
    // change), so it already closes over the current render's value.
    target.current += delta * degPerPx(geometry.cardWidth);
    kick();
  }

  function endDrag(event: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    // Carry the release speed, so a fast flick spins the ring further
    // than a slow drag — the difference between a gesture that responds
    // to you and one that just stops. No clamp here (see header note):
    // unlike proof-wall's bounded panorama, this ring has no edge to
    // run out of.
    //
    // Gated on `reduced` — this is the one part of the interaction that
    // actually is automatic motion (the ring keeps turning after the
    // finger has already lifted), unlike the drag itself. Onpointerdown/
    // Move/the wheel handler above used to *all* bail out under
    // prefers-reduced-motion, which didn't protect anyone from
    // unexpected motion — it just made a 100%-user-driven, direct-
    // manipulation ring not respond to being dragged at all, which is a
    // real, broken "stuck" carousel for anyone with that preference on,
    // not a considerate degradation of it.
    if (!reduced) target.current += velocity.current * 8;
    kick();
  }

  if (n === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          // overflow-hidden: the stage is a genuine frame now, not a
          // window onto content that happens to bleed past it — see
          // STAGE_HEIGHT_RATIO's own note. Rarely actually clips
          // anything (the height already clears the magnified card with
          // margin); it's here so that stays true by construction
          // instead of by coincidence.
          //
          // cursor-grab unconditional now, not `!reduced &&` — dragging
          // itself isn't gated on reduced-motion any more (see endDrag's
          // own note on why only the post-release momentum is), so the
          // cursor shouldn't claim otherwise.
          "relative mx-auto w-full max-w-[1100px] cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
        )}
        style={{ perspective: geometry.perspective, height: geometry.stageHeight }}
        role="group"
        aria-label={`${n} videos we made and posted — drag or swipe to spin`}
      >
        <div
          ref={ringRef}
          className="absolute inset-0 [transform-style:preserve-3d] will-change-transform"
        >
          {items.map((poster, i) => (
            <CarouselCard
              key={`${poster.id}-${i}`}
              poster={poster}
              angle={i * stepDeg}
              geometry={geometry}
              totalMoved={totalMoved}
              setVideoRef={(node) => {
                videoRefs.current[i] = node;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
