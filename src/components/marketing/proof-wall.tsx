"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProofPoster } from "@/lib/proof-thumbnails";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import { LitWords } from "@/components/marketing/lit-words";
import { cn } from "@/lib/utils";

/**
 * The proof, as one thing.
 *
 * This replaces two separate components that were both doing the same
 * job in different places — a stacked poster deck in the hero and a
 * snap-scrolling card deck in its own section further down. Between them
 * the same four videos appeared twice on one page, in two different
 * interactions, with two different sets of controls. That is not a
 * design with two moments in it, it is one idea built twice, and it read
 * exactly like that. There is one proof system now, and it does the
 * whole job: the videos, the real numbers on them, and a link straight
 * out to each real post.
 *
 * There is no written breakdown panel under it any more. That card
 * restated the same view count the tile already carried, then spent most
 * of its height on placeholder-adjacent copy for the fields that have
 * not been analysed yet — a large, mostly-empty box sitting directly
 * under the strongest thing on the page. The evidence is the videos and
 * the numbers on them; the explanation of how any of it works is what
 * the course is.
 *
 * THE PANORAMA. The videos sit on a shallow cylinder seen from close up,
 * pressed edge to edge with no gap between them. Each one turns to face
 * the middle as it goes, but only a little: this is close-up and flat,
 * not a deep recession into the screen, so the depth cue is mostly the
 * turn and barely the distance. Corners are only slightly rounded — the
 * same radius every other real-video frame on the page uses now (see
 * VideoPlayer's "premium" frame and PlatformEmbed) — which does put a
 * small notch of the stage's own background at each shared corner
 * instead of one unbroken seam; the tiles' actual width, spacing and
 * pan bounds (geometry.tileWidth / .spacing / .panLimit below) are pure
 * layout math untouched by that, a border-radius changes nothing about
 * a box's own dimensions.
 *
 * BIGGER THAN THE VIEWPORT, ON PURPOSE. Tile size is a fraction of the
 * viewport, not the viewport divided by however many videos exist —
 * which means adding a fifth video no longer means shrinking all five to
 * survive. Videos this size don't all fit on screen at once, especially
 * on a phone, which is exactly why the pan exists: not a decoration on
 * top of a wall that already showed everything, but the actual way you
 * see the rest of it.
 *
 * BOUNDED TO THE REAL CONTENT. The pan travels exactly as far as there
 * is anything left to reveal — the moment the last video has been pulled
 * fully into view, panning further stops doing anything. An earlier
 * version clamped the drag by "how many videos, divided by two," which
 * is the right idea for a strip that already fits the screen but leaves
 * a visible dead zone of empty stage past the last video once the tiles
 * are big enough to overflow it — dragging into a void the videos never
 * occupied. The limit below is sized from the actual overhang (how many
 * tile-widths of content spill past the viewport at this size), which is
 * zero, and therefore not draggable at all, whenever everything already
 * fits.
 *
 * NOTHING MOVES ON ITS OWN. No auto-advance, no drift. The wall is
 * static until someone touches it — a panorama that is already showing
 * you everything has nothing to advance to, and constant movement behind
 * a headline is the exact "busy, not alive" failure the rest of the page
 * avoids.
 *
 * THE SWIPE. Two deliberate departures from a normal carousel:
 *
 *   Inverted. Dragging right brings the tiles on the right toward you
 *   rather than pushing them away. You are turning the cylinder, not
 *   dragging a strip of paper — and on a cylinder seen from inside, the
 *   surface under your finger travels the other way. Getting this
 *   backwards is what makes 3D carousels feel wrong to use.
 *
 *   Damped, not direct. The wall does not track the finger 1:1 and stop
 *   dead. Every frame it closes a fraction of the distance to where it
 *   is heading, so it trails slightly behind the gesture and glides to
 *   rest afterwards, carrying whatever speed the release had. That lag
 *   is the whole feel of the thing. It is also why there is no snapping:
 *   with an even number of videos the resting arrangement is symmetric
 *   about the middle, and snapping each tile to dead centre would
 *   destroy that every time anyone touched it.
 *
 * NO DOT STRIP. A position indicator would have to either track exact
 * scroll progress (a control nobody asked for, on a wall meant to feel
 * like a physical thing you push, not a paginated list) or count videos
 * that are already right there to be counted by looking. The tiles
 * themselves are the only control this needs.
 *
 * REAL LINKS. Every tile is an anchor to the real post on the real
 * account — so cmd-click, middle-click, "copy link address" and a
 * crawler all behave correctly, and there is always a way to the
 * original even if nothing else on the page works. A click is only
 * suppressed when the pointer actually moved, so a drag never navigates
 * by accident.
 */

/** How much of the remaining distance the wall closes each frame. Low
 * enough to trail the finger noticeably; high enough that it never feels
 * like it is fighting you. */
const DAMPING = 0.085;

/** Below this the wall is at rest and the loop parks itself rather than
 * spinning forever on sub-pixel movement. */
const REST_EPSILON = 0.0005;

/** Drag distance, px, past which a pointer-up is a swipe and not a click.
 * Below it the tile's link opens as normal. */
const CLICK_SLOP = 8;

/** Per slot away from the middle: how far the tile turns and how far it
 * travels toward the camera. Deliberately mild — tiles are pressed edge
 * to edge and close to the glass, not deep in a receding tunnel, so the
 * turn is what reads as depth, not distance.
 *
 * Notably absent: a per-slot scale. Every tile is exactly tileWidth by
 * tileHeight, always, full stop — no tile is ever bigger than its
 * neighbour. That used to be one of the three depth cues, back when
 * there were real gaps between tiles for a bigger outer tile to bridge.
 * There is no gap left to bridge, and letting an off-centre tile grow
 * past its neighbour's is exactly what breaks a shared edge between two
 * of them — a wall that is meant to read as one continuous surface can't
 * have some panels bigger than others. */
const ROTATE_PER_SLOT = 10;
const DEPTH_PER_SLOT = 18;
/** How much a tile's own perspective projection alone (translateZ under
 * the stage's `perspective`, no explicit scale) magnifies it on screen
 * at the panel that ends up furthest from centre — used only to give
 * the stage a little vertical headroom so that residual growth is never
 * clipped, not to size the tiles themselves. */
const EDGE_PERSPECTIVE_HEADROOM = 1.08;

type Geometry = {
  spacing: number;
  tileWidth: number;
  tileHeight: number;
  stageHeight: number;
  /** How far, in tile-widths, the wall can be panned off its resting
   * position before every video has already been pulled fully on
   * screen — see the header note on why this isn't just "count / 2"
   * once tiles are big enough to overflow the viewport. Zero when the
   * whole set already fits without panning at all. */
  panLimit: number;
};

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

function ProofTile({
  poster,
  width,
}: {
  poster: ProofPoster;
  /** The tile's rendered width, so the number on it can be sized as a
   * proportion of the tile rather than at a fixed size. At four videos
   * across a phone a tile is around 100px wide, and a view count set at
   * the desktop size simply does not fit inside one. */
  width: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = poster.thumbnail !== null && !failed;

  return (
    <>
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed TikTok CDN poster from their own oEmbed response, resolved server-side (lib/proof-thumbnails.ts); not a local asset and not a fixed-size layout image */}
          <img
            src={poster.thumbnail!}
            alt=""
            className="size-full object-cover transition-[filter] duration-300 ease-[var(--ease-cinematic)]"
            style={{
              // Dimmed, not desaturated to black — the tile in focus is
              // fully lit and every other one sits at a fixed, slightly
              // cooler floor, which reads as depth without any of them
              // looking switched off. Every one of these is real,
              // published proof; none should look disabled.
              //
              // Driven by a CSS variable the parent's own animation loop
              // writes directly onto this tile (paint(), in ProofWall)
              // rather than by a `focus` prop flowing through React — a
              // prop here would mean every frame the nearest tile
              // changed turned into a state update and a re-render of
              // every tile just to flip this one value, competing with
              // that same frame's transform write for the main thread.
              // paint() also only ever writes this when the tile in
              // focus actually changes, same as it does for z-index —
              // unlike a transform, a filter is real per-pixel
              // recolouring, so it's written rarely on purpose and the
              // transition above is what turns that rare, instant flip
              // into a fade. This line itself never re-runs; only the
              // variable it reads does.
              //
              // Default 0.45, not 1: paint() only ever writes this
              // variable on the tile that just gained focus and the one
              // that just lost it — every tile that has never held focus
              // is deliberately left with no inline value at all, and
              // has to fall back to the dim floor on its own, or it
              // would render fully lit until the day it happens to win.
              filter:
                "grayscale(calc((1 - var(--tile-focus, 0.45)) * 0.55)) brightness(calc(0.62 + var(--tile-focus, 0.45) * 0.38))",
            }}
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
          />
          {/* Edge scrim. These are real frames from real videos, and a
              bright one — a screen recording, a white-background product
              shot — is otherwise a hard white rectangle punched into a
              very dark page. Darkens the outer edges only, leaving the
              middle of the frame where the actual content is. */}
          <span
            aria-hidden
            className="absolute inset-0 shadow-[inset_0_0_0_1px_oklch(0_0_0_/_0.4),inset_0_0_60px_18px_oklch(0_0_0_/_0.45)]"
          />
        </>
      ) : (
        // No poster resolved (Instagram has no unauthenticated oEmbed,
        // and a signed TikTok URL can expire or be refused). Not a
        // placeholder image pretending to be a frame — the number, which
        // is the actual content of this tile anyway.
        <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-surface-3 to-surface-1 p-3 text-center">
          <span className="text-lit text-xl leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-2xl">
            {poster.views ?? "—"}
          </span>
          <span className="font-mono text-[0.55rem] tracking-[0.16em] text-muted-foreground uppercase">
            views
          </span>
        </div>
      )}

      {/* The number, on the tile it belongs to. A view count attached to
          the video it measures is evidence; the same number in a panel
          somewhere else on the page is a claim. */}
      {poster.views && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,oklch(0_0_0_/_0.9)_0%,oklch(0_0_0_/_0.45)_60%,transparent_100%)] px-3 pt-10 pb-3 text-center sm:px-4 sm:pb-4">
          <span
            className="text-lit block leading-none font-semibold tracking-[-0.02em] tabular-nums"
            style={{ fontSize: `${clamp(width * 0.15, 13, 26).toFixed(1)}px` }}
          >
            {poster.views}
          </span>
          <span
            className="mt-1.5 block font-mono tracking-[0.14em] text-white/60 uppercase"
            style={{ fontSize: `${clamp(width * 0.06, 7, 10).toFixed(1)}px` }}
          >
            views
          </span>
        </span>
      )}
    </>
  );
}

export function ProofWall({ posters }: { posters: ProofPoster[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const [geometry, setGeometry] = useState<Geometry>({
    spacing: 240,
    tileWidth: 240,
    tileHeight: 427,
    stageHeight: 470,
    panLimit: 0,
  });
  const [reduced, setReduced] = useState(false);

  const count = posters.length;
  /** Half the tile count. Purely a layout constant — it's how far the
   * outermost tile sits from the middle when the wall is at rest, kept
   * separate from how far the wall can actually be *panned*
   * (geometry.panLimit), which additionally depends on how many tiles
   * fit in the viewport at the current size. */
  const restSpan = (count - 1) / 2;

  // The wall's position, in tile units. `target` is where it is heading,
  // `position` is where it currently is; the gap between them is the
  // glide. All of this lives in refs, not state — every one of these
  // changes every frame during a drag, and a re-render per frame would
  // be pointless work fighting the same-frame transform write for the
  // main thread. Nothing about which tile currently reads as "in focus"
  // is state either, for the same reason — see paint()'s own note.
  const target = useRef(0);
  const position = useRef(0);
  const velocity = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const totalMoved = useRef(0);
  /** Set while a pointer is resting on a specific tile, which overrides
   * the geometric "nearest the middle" choice for which tile paint()
   * brings to full colour. */
  const hovered = useRef<number | null>(null);
  /** Last z-index written per tile, so paint() can skip the DOM write
   * when the stacking order hasn't actually changed. On a phone this is
   * the difference between one style write per tile per frame and one
   * only when a tile actually passes another — z-index isn't covered by
   * the transform layer's `will-change`, so an unchanged write still
   * costs a style recalc that a changed one wouldn't avoid anyway. */
  const lastZIndex = useRef<(number | null)[]>([]);
  /** Which tile currently holds focus, so paint() only ever touches the
   * two tiles whose colour actually changes (the old winner, the new
   * one) instead of writing --tile-focus on all of them every frame.
   * This one has to be exact, not just "skip an identical write" like
   * lastZIndex — a CSS filter is real per-pixel recolouring, not a
   * compositor-only property like transform or z-index, so doing it on
   * five images on every frame of a drag is real, avoidable work a
   * phone GPU feels. */
  const lastFocused = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Geometry is measured from the stage rather than chosen per
  // breakpoint: the panorama's proportions have to scale continuously
  // with the viewport, or it looks composed at exactly two widths and
  // wrong everywhere in between.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const measure = (): Geometry => {
      const width = stage.clientWidth;
      // A fraction of the viewport, not the viewport divided by the
      // count — see the header note on why. Clamped so a phone still
      // gets a real, sizeable video rather than a sliver, and a huge
      // desktop screen doesn't turn one tile into the entire viewport.
      const tileWidth = Math.round(clamp(width * 0.46, 190, 320));
      const tileHeight = Math.round((tileWidth * 16) / 9);
      // No gap: spacing between tile *centres* equals a tile's own
      // width, so consecutive tiles sit flush against each other with
      // nothing showing between them.
      const spacing = tileWidth;

      // How many tiles fit across the viewport at this size, and — the
      // point of doing it this way — how much of the wall is actually
      // left over to pan through once that many are already on screen.
      // Zero (not negative) the moment everything already fits: there's
      // nothing to reveal by panning, so nothing should move.
      const visibleCount = width / spacing;
      const panLimit = Math.max((count - visibleCount) / 2, 0);
      return {
        spacing,
        tileWidth,
        tileHeight,
        // Every tile is the same tileHeight regardless of position — see
        // EDGE_PERSPECTIVE_HEADROOM's own note on the one small exception
        // (the perspective projection itself, not an explicit scale)
        // this still leaves headroom for.
        stageHeight: Math.round(tileHeight * EDGE_PERSPECTIVE_HEADROOM + 16),
        panLimit,
      };
    };

    setGeometry(measure());
    const observer = new ResizeObserver(() => setGeometry(measure()));
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  /** Writes every tile's transform, stacking order and colour for the
   * current position — the only thing that touches the DOM per frame,
   * and it does it directly rather than through React state. Which tile
   * currently reads as "in focus" used to be React state (`active`,
   * flipped by this same function every time the nearest tile changed)
   * purely so a `focus` prop could reach each tile's filter — which
   * meant every crossing between two videos during a drag was a state
   * update and a full re-render of all of them, on the same frame this
   * function was already writing their transforms directly. Two
   * different systems fighting over the same frame is exactly what a
   * stutter is; there's no reason focus needs a system React can see at
   * all; it's written here as a CSS variable, the same way transform and
   * z-index already are — and, unlike them, only on an actual change
   * (see lastFocused): a filter is real pixel work, not something a
   * phone GPU can shrug off sixty times a second on every tile. */
  const paint = useCallback(() => {
    const { spacing } = geometry;
    let nearest = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < count; i++) {
      const tile = tileRefs.current[i];
      if (!tile) continue;

      // Laid out symmetrically about the middle of the screen and then
      // shifted by however far the wall has been panned. Not wrapped:
      // the pan is bounded to the real content (geometry.panLimit), so
      // there is never a far side of a loop to wrap to — a wrap would
      // mean a tile teleporting across the viewport in full view.
      const slot = i - restSpan - position.current;
      const distance = Math.abs(slot);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }

      // No scale term — see ROTATE_PER_SLOT's header note on why every
      // tile stays exactly geometry.tileWidth by geometry.tileHeight no
      // matter how far it's turned.
      tile.style.transform =
        `translate3d(${(slot * spacing).toFixed(1)}px, 0, ${(distance * DEPTH_PER_SLOT).toFixed(1)}px) ` +
        `rotateY(${(-slot * ROTATE_PER_SLOT).toFixed(2)}deg)`;

      // Nearest to the camera paints on top. Without this the tiles at
      // the edges — the ones physically closest to the viewer — render
      // underneath the middle ones and the depth reads inside out.
      const z = 100 + Math.round(distance * 10);
      if (lastZIndex.current[i] !== z) {
        tile.style.zIndex = String(z);
        lastZIndex.current[i] = z;
      }
    }

    // Exactly one tile in focus at a time: whichever is under the mouse
    // if any is, otherwise whichever is nearest the middle. Touched only
    // when that winner actually changes — the old winner drops back to
    // the dim floor, the new one lights up, nobody else is written.
    const winner = hovered.current ?? nearest;
    if (lastFocused.current !== winner) {
      const prevTile = lastFocused.current !== null ? tileRefs.current[lastFocused.current] : null;
      prevTile?.style.setProperty("--tile-focus", "0.45");
      tileRefs.current[winner]?.style.setProperty("--tile-focus", "1");
      lastFocused.current = winner;
    }
  }, [geometry, count, restSpan]);

  /**
   * The glide.
   *
   * The loop lives inside an effect rather than in a useCallback that
   * schedules itself: a self-referencing useCallback is both a lint
   * error and a real footgun, since every identity change would leave a
   * frame already queued against the previous closure. Scoped here, the
   * function, its running flag and its handle are all one unit that the
   * cleanup can cancel completely.
   */
  const kickRef = useRef<() => void>(() => {});
  useEffect(() => {
    let handle = 0;
    let live = false;

    function loop() {
      const gap = target.current - position.current;
      position.current += gap * DAMPING;
      velocity.current = gap * DAMPING;

      if (Math.abs(gap) < REST_EPSILON) {
        // Close enough. Land exactly on target and park — an idle
        // panorama should cost nothing at all.
        position.current = target.current;
        live = false;
        paint();
        return;
      }
      paint();
      handle = requestAnimationFrame(loop);
    }

    kickRef.current = () => {
      if (live) return;
      live = true;
      handle = requestAnimationFrame(loop);
    };

    // Repaint on geometry changes even at rest, or a resize leaves every
    // tile transformed for the old spacing.
    paint();

    return () => {
      cancelAnimationFrame(handle);
      live = false;
    };
  }, [paint]);

  const kick = useCallback(() => kickRef.current(), []);

  /**
   * Trackpad and wheel, alongside the drag.
   *
   * A horizontal two-finger swipe on a trackpad is how most desktop
   * users expect to move something laid out sideways, and it is the only
   * way to move this at all without pressing a button down. Vertical
   * wheel input is deliberately left alone and handed straight to the
   * page: hijacking it would mean scrolling past the largest object on
   * the first screen required going around it.
   *
   * Attached here rather than as an onWheel prop because the handler has
   * to call preventDefault, and React attaches wheel listeners passively
   * — inside a passive listener preventDefault does nothing and the
   * browser also fires a console warning about it.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      // Same inversion as the drag, for the same reason — see the
      // header. A trackpad swipe is a drag with no finger on the glass.
      target.current = clamp(
        target.current - event.deltaX / geometry.spacing,
        -geometry.panLimit,
        geometry.panLimit
      );
      kick();
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [geometry.spacing, geometry.panLimit, kick, reduced]);

  function onPointerDown(event: React.PointerEvent) {
    if (reduced) return;
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
    // PLUS, not minus. See the header: this is the inside of a cylinder,
    // so the surface under the finger has to travel opposite to the
    // finger. Flipping this sign is the single change that makes the
    // whole thing feel wrong.
    target.current = clamp(
      target.current + delta / geometry.spacing,
      -geometry.panLimit,
      geometry.panLimit
    );
    kick();
  }

  function endDrag(event: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    // Carry the release speed, so a fast flick travels further than a
    // slow drag — the difference between a gesture that responds to you
    // and one that just stops.
    target.current = clamp(
      target.current + velocity.current * 8,
      -geometry.panLimit,
      geometry.panLimit
    );
    kick();
  }

  if (count === 0) return null;

  return (
    <section
      id="proof"
      className="relative scroll-mt-20 pt-16 pb-24 sm:pt-20 sm:pb-28 lg:scroll-mt-32"
    >
      {/*
        The claim — "01, The evidence" — leads, and the wall is the proof
        of it, so it has to read afterward, not before. This block is a
        Reveal like everything else this far down the page: it isn't on
        screen at load (the hero fills the first screen on its own), so
        it only actually reveals once someone has scrolled past "you
        don't need a following to get views" and this section starts
        entering the viewport — see reveal.tsx on why that's automatic
        for anything below the fold rather than something this component
        has to arrange itself.
      */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <SectionEyebrow index="01" label="The evidence" />
          </Reveal>
          <Reveal delay={BEAT.title}>
            <LitWords
              as="h2"
              className="text-lit mt-5 text-3xl leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-[2.6rem]"
            >
              We didn&apos;t guess. We tested it.
            </LitWords>
          </Reveal>
          <Reveal delay={BEAT.lede}>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
              No experience. No huge following. No expensive setup. Every one
              of those is a real post on a real account — tap any of them to
              go and watch it.
            </p>
          </Reveal>
        </div>
      </div>

      {/*
        Full-bleed and clipped. The panorama's whole point is that the
        outer tiles run off both edges of the screen, which means the
        stage must be as wide as the viewport and must clip — a
        3D-transformed child that escapes its box widens the document and
        turns into a page-wide horizontal scrollbar on a phone, a bug
        this codebase has already been bitten by once.

        touch-action: pan-y so a vertical drag started on the wall still
        scrolls the page. The wall is the largest object on the first
        screen; making it a dead zone for vertical scrolling would be
        unforgivable on a phone.
      */}
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "relative mt-12 w-full overflow-hidden select-none [perspective:1100px] sm:mt-16",
          !reduced && "cursor-grab active:cursor-grabbing"
        )}
        style={{ height: geometry.stageHeight, touchAction: "pan-y" }}
        role="group"
        aria-label={`${count} videos we made and posted`}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {posters.map((entry, i) => (
            <a
              key={entry.id}
              ref={(node) => {
                tileRefs.current[i] = node;
              }}
              href={entry.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              // A drag must never navigate. The threshold is deliberately
              // small: anything the user would call a tap stays a tap.
              onClick={(event) => {
                if (totalMoved.current > CLICK_SLOP) event.preventDefault();
              }}
              // Pointing at a video brings it to full colour. Touch
              // never fires these, which is why the geometric "nearest
              // the middle" choice stays the fallback rather than being
              // replaced by them — on a phone the tile you have swiped
              // to the middle is the lit one.
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                hovered.current = i;
                paint();
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "mouse") return;
                hovered.current = null;
                paint();
              }}
              onFocus={() => {
                hovered.current = i;
                paint();
              }}
              onBlur={() => {
                hovered.current = null;
                paint();
              }}
              draggable={false}
              aria-label={`${entry.label}${entry.views ? `, ${entry.views} views` : ""} — watch on ${entry.platform ?? "the original post"}`}
              // Still no per-tile border/outline — that would draw its
              // own line at every shared edge regardless of corner
              // radius. rounded-sm only softens the four corners of each
              // tile; it doesn't add spacing or change width/height, so
              // the drag geometry above (all pixel math on tileWidth /
              // spacing / panLimit) is exactly as before.
              className="focus-premium absolute top-1/2 left-1/2 block overflow-hidden rounded-sm bg-surface-2 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.1),0_40px_90px_-30px_oklch(0_0_0_/_0.95)]"
              style={{
                width: geometry.tileWidth,
                height: geometry.tileHeight,
                // The tile's transform is written per frame by paint();
                // these margins centre it first, so the transform can be
                // expressed purely as an offset from the middle of the
                // stage.
                marginLeft: -geometry.tileWidth / 2,
                marginTop: -geometry.tileHeight / 2,
                willChange: "transform",
                // backfaceVisibility: free insurance against a phone GPU
                // rasterising the far side of a rotated plane it will
                // never actually show — costs nothing when a tile is
                // barely turned, and stops mattering less as the rotation
                // gets milder, never more.
                //
                // touchCallout/tapHighlightColor: without these, iOS
                // shows its own UI on top of the drag — a save-image
                // callout on a slow press, a grey highlight flash on a
                // fast one — neither of which this component's own
                // pointer handling asked for. Both read as a stutter
                // that has nothing to do with frame rate.
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <ProofTile poster={entry} width={geometry.tileWidth} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
