"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ONE, ALONE → SHOOTS UP → EXPANDS → BECOMES A TIGHT CIRCLE → THE REST
 * EMERGE FROM BEHIND IT → THE RING ROTATES OUTWARD INTO THE FULL
 * COMPOSITION → SUBTLE ORBIT.
 *
 * A reusable radial-emergence composition. One item appears alone and
 * holds — faded in, fully visible, doing nothing else — for a real beat
 * before anything moves: that hold is deliberate, not padding, because
 * the whole sequence only reads as "one becomes many" if a viewer
 * actually registers the one first. Only then does it lift off
 * its resting spot and balloon into a large, unmistakably circular shape
 * — that dramatic bloom *is* "the circle" the brief asks for, not a
 * separate shape drawn behind it. As it relaxes back down out of that
 * peak, the rest of the set peels out from directly behind it and arcs
 * into a tight, compact ring around it. Once every item is present, that
 * tight ring is the whole set already — cohesive, unmistakably circular,
 * sized to read at a glance — and it then grows outward, spinning as it
 * goes, its own spacing opening up as it does into an evenly gapped
 * final composition. Once it arrives, the whole group turns, very
 * slowly, with every item staying upright.
 *
 * WHY IT IS BUILT THIS WAY RATHER THAN AS A ROW THAT FADES IN. The
 * sequence is the argument. A logo strip says "here are five companies".
 * Credibility visibly multiplying outward from a single origin says "one
 * system, proven, then applied again and again" — which is the actual
 * claim, and it lands before a word of the heading has been read.
 *
 * WHY THE MIDDLE BEAT IS A SIZE CHANGE, NOT A SEPARATE DRAWING. Every
 * badge is already a circle (see BrandBadge). Making the lone origin
 * badge swell to its largest size *is* "one brand becomes a tight, large
 * circle" — there is nothing else it needs to turn into. The rest of the
 * set then has somewhere to come from: they surface from directly behind
 * that swollen disc (lower z-index, starting at the exact same point,
 * fully hidden under it) rather than sprouting out of empty space.
 *
 * WHAT IT DELIBERATELY IS NOT. Not an ellipse: a ring squashed to 62%
 * height and lit by depth reads as a disc lying in perspective and makes
 * half the marks smaller and dimmer than the other half at any moment. A
 * true circle with every item at identical size and opacity once it has
 * arrived is what makes five different companies read as one set of
 * credentials, which is the entire point of the section. It is also not
 * one shape scaled down for mobile — see DESKTOP / MOBILE below: the
 * radii, the size of the dramatic bloom and the arc every item travels
 * are tuned per breakpoint so the tight circle is never a squint-sized
 * cluster on a phone, and the desktop version is never a cramped mobile
 * one stretched wide.
 *
 * SCROLL TRIGGERS IT; TIME DRIVES IT. Scrolling the composition into view
 * is what starts the sequence, but a scrollbar is not a scrub bar for it:
 * once started, progress comes from elapsed time at a fixed pace (see
 * PLAYBACK_DURATION), identically whether the visitor scrolled fast,
 * slow, or is holding still reading the heading. A viewer who scrolls
 * straight past still gets to watch it, because leaving the viewport
 * pauses the clock rather than losing the time (see `start`/`stop`), and
 * one who scrolls back up mid-sequence finds it exactly where they left
 * it rather than rewound — it only ever plays forward, once.
 *
 * CONTINUITY. Every phase boundary below is a place where two formulas
 * hand off to each other, and each pair is chosen so their values agree
 * exactly at the handoff (verified by construction, not by eye) — the
 * whole point of the exercise is that nothing snaps, jumps, or overlaps
 * unpredictably as it crosses from one beat into the next.
 *
 * GENERIC ON PURPOSE. It knows nothing about brands — it takes a list and
 * a render function, so the same choreography can carry any set of marks
 * later without this being reimplemented as a one-off.
 */

/** How long the whole sequence takes to play once triggered, in seconds.
 * This is the one place "speed" lives — see SCROLL TRIGGERS IT above.
 * Everything below is a fraction of this fixed duration, not of however
 * much of it a given scroll gesture happened to cover. */
const PLAYBACK_DURATION = 3.2;

/** Phase boundaries, as a fraction of PLAYBACK_DURATION. Each is a
 * hand-off point where the formula for every item changes — see
 * CONTINUITY above. */
/** The origin sits alone, fully visible, doing nothing else — no shoot,
 * no bloom — until this point. This is "ONLY ONE BRAND FIRST" as its own
 * held beat rather than something the shoot-and-bloom motion blurs past
 * on its way to happening: without a real pause here, the fade-in and
 * the lift-off overlap so closely that a viewer never sees a single,
 * stationary card before everything starts moving. */
const HOLD_END = 0.14;
/** The origin starts its dramatic bloom (see BEAT below). */
const EXPAND_PEAK = 0.34;
/** The bloom has relaxed back down and every other item has arrived at
 * the tight ring: the full set is now visible, compact, and circular. */
const CIRCLE_FORM_END = 0.62;
/** The tight ring has finished growing out to its final, evenly-gapped
 * radius. What is left of the progress range is settle-and-latch. */
const FULL_EXPAND_END = 0.92;
/** How much of the post-hold window the origin spends purely lifting
 * off — scale held at 1 — before it starts to swell. Keeps "shoots up"
 * legible as its own beat instead of blurring into "expands" from
 * frame one. */
const SCALE_RISE_SPAN = 0.08;
/** The absolute progress point that span resolves to. Derived rather
 * than typed as a second number: SCALE_RISE_SPAN is documented as a
 * share of the POST-HOLD window, so its start is necessarily HOLD_END,
 * and writing 0.22 here by hand would silently stop tracking HOLD_END
 * the first time that moved. */
const SCALE_RISE_START = HOLD_END + SCALE_RISE_SPAN;
/** How long the origin badge takes to fade in at the very start — this
 * runs concurrently with, and finishes well inside, HOLD_END. */
const ORIGIN_FADE_IN = 0.06;
/** How long any one non-origin item takes to travel from behind the
 * origin out to its tight-ring slot, as a share of progress. */
const TRAVEL_SPAN = 0.14;
/** The smallest scale a non-origin item is caught at, the instant it
 * first peeks out from behind the origin. */
const ITEM_MIN_SCALE = 0.28;
/** Centre-to-centre spacing between adjacent badges while the ring is
 * still tight, as a multiple of their own diameter — see `measure`'s
 * radius derivation. 1 would be edge-to-edge touching; this leaves the
 * faintest breathing room so "tight, compact circle" doesn't read as
 * badges physically stacked on one another. */
const TIGHT_SPACING = 1.08;
/** Centre-to-centre spacing between adjacent badges once the ring has
 * fully opened out, as a multiple of their own diameter. Calibrated
 * against the reference composition's own proportions — a clear, even
 * gap on either side of each badge, not touching and not a sparse
 * scatter. Deliberately larger than TIGHT_SPACING: the gap visibly
 * opening up as the ring grows is what makes "rotate/expand into the
 * full composition" read as opening out rather than just getting bigger
 * while staying clumped. */
const FINAL_SPACING = 1.5;

/**
 * Per-breakpoint geometry. Not the same composition scaled — the two are
 * tuned independently against what each viewport can afford. Neither
 * radius below is tuned as a guessed fraction of the container: both the
 * tight-ring radius and the final radius are derived at runtime from the
 * badges' real measured size (see `measure`), so the composition is
 * built from the actual artwork rather than a number picked to roughly
 * fit it.
 *
 *  - Desktop's origin bloom goes bigger (2.1×) because desktop has the
 *    surrounding whitespace to spend on drama without nearing the
 *    viewport edge; mobile's bloom (1.8×) is tuned to stay safely inside
 *    a narrow column at the same relative position, still a real swell.
 *  - `tightItemScale` is what the whole set — origin included — settles
 *    to the instant the tight ring is complete, before the ring grows
 *    out to its full radius at a full scale of 1. Combined with
 *    TIGHT_SPACING being snugger than FINAL_SPACING, the badges start
 *    smaller *and* closer together and end larger *and* further apart —
 *    both axes opening up together is what sells "expand" as an actual
 *    unfolding rather than the ring just getting wider.
 *  - Mobile's arc sweep and expansion spin are both narrower, so the
 *    emerge-and-open motion stays legible in a smaller, denser space
 *    instead of feeling like it is trying to do a desktop-sized flourish
 *    in a pocket-sized box.
 */
type Geometry = {
  /** How large the lone origin badge grows at the peak of its bloom. */
  originPeakScale: number;
  /** The scale every item — including the settled origin — sits at while
   * the ring is still tight, before it inflates outward. */
  tightItemScale: number;
  /** Degrees an emerging item starts behind its final angle, curving the
   * path out from behind the origin rather than sending it in a straight
   * line. */
  arcSweep: number;
  /** Extra rotation the ring sweeps through while inflating from tight
   * to final radius — what makes the outward growth read as unwinding
   * open rather than a static ring that simply got bigger. */
  expandOrbitDeg: number;
  /** Degrees per second of the idle orbit once fully settled. */
  orbitSpeed: number;
};

const DESKTOP: Geometry = {
  originPeakScale: 2.1,
  tightItemScale: 0.82,
  arcSweep: 52,
  expandOrbitDeg: 58,
  orbitSpeed: 6,
};

const MOBILE: Geometry = {
  originPeakScale: 1.8,
  tightItemScale: 0.86,
  arcSweep: 40,
  expandOrbitDeg: 42,
  orbitSpeed: 5,
};

/** Matches the Tailwind `sm:` breakpoint the badges themselves switch
 * size at, so the geometry and the artwork change together. */
const DESKTOP_QUERY = "(min-width: 640px)";

/** Expo-out — the same shape as --ease-cinematic, in JS, because this is
 * driven per frame rather than by a CSS transition. Every entrance on the
 * site lands on the same curve or the page stops feeling like one system. */
function easeOut(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function Constellation<T>({
  items,
  renderItem,
  keyOf,
  className,
  glowTint = "oklch(1 0 0 / 0.14) 0%, oklch(1 0 0 / 0.04) 45%",
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyOf: (item: T, index: number) => string;
  className?: string;
  /** The origin light's two inner gradient stops (colour + position each,
   * comma-separated) — a plain white glow by default. Brands passes a
   * crimson-tinted pair instead: the page's one accent colour, on the
   * one element in this composition that was reading as flatly
   * black-and-white once every badge itself went grayscale (see
   * BrandBadge's own note in brand-constellation.tsx) — without
   * touching a single logo's real pixels or adding a coloured ring
   * around each disc, which read as a distracting "lining" when tried. */
  glowTint?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const glowRef = useRef<HTMLDivElement>(null);
  const count = items.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Geometry is measured from the box and re-picked from DESKTOP/MOBILE
    // on every measurement, so a resize or an orientation change swaps
    // the whole tuned geometry rather than just rescaling one number.
    let geo: Geometry = DESKTOP;
    let size = 0;
    let finalRadius = 0;
    let tightRadius = 0;
    const measure = () => {
      const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
      geo = isDesktop ? DESKTOP : MOBILE;
      size = Math.min(container.clientWidth, container.clientHeight);

      // Both radii are worked backwards from the badges' own real,
      // measured width (offsetWidth ignores the transform scale already
      // applied to it, so this is the badge's true size regardless of
      // which frame we're mid-animation on) rather than guessed as a
      // fraction of the container. For `count` circles evenly spaced on
      // a ring of radius r, the distance between two neighbouring
      // centres is 2r·sin(π/count); setting that equal to a badge's own
      // diameter at a given scale (times the spacing multiple wanted at
      // that stage) gives exactly the radius that produces that spacing,
      // for however many items there are.
      const badgeSize = itemRefs.current[0]?.offsetWidth || size * 0.16;
      const spacing = count > 1 ? 2 * Math.sin(Math.PI / count) : 1;
      tightRadius = (badgeSize * geo.tightItemScale * TIGHT_SPACING) / spacing;
      finalRadius = (badgeSize * FINAL_SPACING) / spacing;
    };
    measure();

    /** Seconds of real playback time accrued so far. Only ever advances
     * while `layout` is actually being ticked by rAF — which `start` /
     * `stop` gate on visibility — so scrolling the composition off
     * screen mid-sequence freezes this rather than losing the time, and
     * it can never run backwards. This, not scroll position, is what
     * `progress` below is computed from — see SCROLL TRIGGERS IT above. */
    let elapsed = reduced ? PLAYBACK_DURATION : 0;
    /** Real-time-accumulated degrees, added on top of the ring's own
     * expansion spin once it has fully settled — see BEAT 4 below for
     * why the handoff between the two never jumps. */
    let orbit = 0;
    let last = performance.now();
    let frame = 0;
    let visible = false;

    function layout(now: number) {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!reduced) elapsed += delta;
      const progress = clamp01(elapsed / PLAYBACK_DURATION);

      // BEAT 0 — HOLD. Before HOLD_END, `preT` below is clamped to 0 by
      // construction (progress < HOLD_END), which is what makes the origin
      // sit still at distance 0, scale 1: faded in, fully visible, and
      // doing nothing else. "ONLY ONE BRAND FIRST" is this beat, held for
      // real rather than implied by how fast the next one starts.
      //
      // BEAT 1+2 — shoot up, then bloom. Both ride the post-hold window
      // [HOLD_END, CIRCLE_FORM_END], but on different curves: position
      // eases out continuously across the whole window (fast at first,
      // which is what reads as "shoots up"), while scale is held flat at
      // 1 for SCALE_RISE_SPAN so the lift happens on its own before the
      // dramatic swell starts, then relaxes back down to tightItemScale
      // exactly by the end of the window — which is also exactly the
      // scale every other item arrives at, so there is no jump when the
      // ring takes over at CIRCLE_FORM_END.
      const postHoldSpan = CIRCLE_FORM_END - HOLD_END;
      const preT = clamp01((progress - HOLD_END) / postHoldSpan);
      const originTravel = easeOut(preT);
      const originIn = easeOut(clamp01(progress / ORIGIN_FADE_IN));

      const peakT = (EXPAND_PEAK - HOLD_END) / postHoldSpan;
      const riseT = (SCALE_RISE_START - HOLD_END) / postHoldSpan;
      let originScale: number;
      let bloom: number; // 0 → 1 (at peak) → 0, reused for the glow below
      if (preT <= riseT) {
        originScale = 1;
        bloom = 0;
      } else if (preT <= peakT) {
        bloom = easeOut(clamp01((preT - riseT) / (peakT - riseT)));
        originScale = 1 + bloom * (geo.originPeakScale - 1);
      } else {
        bloom = 1 - easeOut(clamp01((preT - peakT) / (1 - peakT)));
        originScale =
          geo.originPeakScale - (1 - bloom) * (geo.originPeakScale - geo.tightItemScale);
      }

      // BEAT 3 — the rest of the set peels out from directly behind the
      // origin (see the per-item loop) as it starts to relax out of its
      // bloom, arcing into a tight, compact ring around it.

      // BEAT 4 — once the tight ring exists, it grows out to its full
      // radius while sweeping through an extra rotation — both the
      // spacing opening up (see FINAL_SPACING) and the rotation are what
      // make the outward growth read as unwinding open rather than a
      // static ring that simply got bigger. The ring only starts ticking
      // on its own once it has actually completed and arrived — starting
      // the idle spin while items are still arriving would make their
      // targets move underneath them.
      const ringGrowT = easeOut(
        clamp01((progress - CIRCLE_FORM_END) / (FULL_EXPAND_END - CIRCLE_FORM_END))
      );
      if (progress >= 0.999) orbit = (orbit + geo.orbitSpeed * delta) % 360;
      const spinDeg = ringGrowT * geo.expandOrbitDeg + orbit;
      const ringRadius = tightRadius + (finalRadius - tightRadius) * ringGrowT;
      const ringScale = geo.tightItemScale + (1 - geo.tightItemScale) * ringGrowT;

      // The pool of light everything comes out of. It swells with the
      // origin's own bloom — that pulse of light is the moment the single
      // mark reads as becoming the circle — then settles to a dim,
      // ambient glow once the ring has fully opened out, so the empty
      // middle keeps reading as a source rather than as a hole.
      if (glowRef.current) {
        const glowOpacity = originIn * (0.24 + bloom * 0.5 + (1 - ringGrowT) * 0.12);
        const glowScale = 0.5 + originTravel * 0.5 + bloom * 0.7 + ringGrowT * 0.6;
        glowRef.current.style.opacity = glowOpacity.toFixed(3);
        glowRef.current.style.transform = `scale(${glowScale.toFixed(3)})`;
      }

      const inRing = progress > CIRCLE_FORM_END;
      const slots = Math.max(count - 1, 1);
      // See the CONTINUITY note above: this stagger is picked so the
      // LAST item's travel window ends at exactly CIRCLE_FORM_END, which
      // is what makes every item's pre-ring formula agree with its
      // post-ring formula at the handoff.
      const stagger = count > 1 ? (CIRCLE_FORM_END - TRAVEL_SPAN - EXPAND_PEAK) / slots : 0;

      for (let i = 0; i < count; i++) {
        const node = itemRefs.current[i];
        if (!node) continue;

        // Item 0 is the origin: the only one visible at the start, the
        // only one that blooms, and the one everyone else emerges from
        // behind. Its resting slot is the top of the circle (-90°),
        // which is what makes "shoots upward" and "arrives at its slot"
        // the same motion rather than two the code has to reconcile.
        const isOrigin = i === 0;
        const finalAngleDeg = (i / count) * 360 - 90;

        let angleDeg: number;
        let distance: number;
        let scale: number;
        let opacity: number;

        if (!inRing) {
          if (isOrigin) {
            angleDeg = -90;
            distance = tightRadius * originTravel;
            scale = originScale;
            opacity = originIn;
          } else {
            const travelStart = EXPAND_PEAK + i * stagger;
            const travel = easeOut(clamp01((progress - travelStart) / TRAVEL_SPAN));
            // Every item starts this arc at the exact same point (the
            // origin's centre, distance 0) and behind it in stacking
            // order — see the zIndex line below — so before `travel`
            // has moved it anywhere it is genuinely hidden underneath
            // the origin, not just coincidentally overlapping it.
            angleDeg = finalAngleDeg - (1 - travel) * geo.arcSweep;
            distance = tightRadius * travel;
            scale = ITEM_MIN_SCALE + travel * (geo.tightItemScale - ITEM_MIN_SCALE);
            opacity = clamp01(travel * 2.4);
          }
        } else {
          angleDeg = finalAngleDeg + spinDeg;
          distance = ringRadius;
          scale = ringScale;
          opacity = 1;
        }

        // No rotation on the element itself — the spin is applied to the
        // ANGLE, so every mark travels around the circle while staying
        // perfectly upright. Rotating the elements is what makes a logo
        // ring look like a fairground wheel.
        const angle = angleDeg * (Math.PI / 180);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
        node.style.opacity = opacity.toFixed(3);
      }

      // Park once the composition is finished and no longer turning —
      // which under reduced motion is immediately, on the first frame.
      if (reduced) return;
      frame = requestAnimationFrame(layout);
    }

    function start() {
      if (visible) return;
      visible = true;
      last = performance.now();
      frame = requestAnimationFrame(layout);
    }
    function stop() {
      if (!visible) return;
      visible = false;
      cancelAnimationFrame(frame);
    }

    if (reduced) {
      layout(performance.now());
      const observer = new ResizeObserver(() => {
        measure();
        layout(performance.now());
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    // Trigger once a third of the composition is actually on screen —
    // no pre-triggering margin, unlike the old scroll-scrubbed version:
    // that used to matter so progress-reading never lagged behind a fast
    // scroll, but playback is time-driven now, so starting early would
    // just mean part of the sequence plays before there's anything to
    // see it. Also pauses (not resets) if scrolled back off screen — see
    // `elapsed`'s declaration.
    const visibility = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.3 }
    );
    visibility.observe(container);
    const onTabVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onTabVisibility);
    const resize = new ResizeObserver(measure);
    resize.observe(container);

    return () => {
      visibility.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", onTabVisibility);
      stop();
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={cn(
        // Sized to the composition itself now that both radii are
        // derived from real badge size rather than guessed as a
        // fraction of this box (see Geometry's doc comment), with
        // headroom for whichever moment draws largest — either the
        // origin's peak bloom or the fully-opened final ring, both of
        // which are recomputed here if FINAL_SPACING or originPeakScale
        // ever move.
        "relative mx-auto flex aspect-square w-full max-w-[17rem] items-center justify-center sm:max-w-[22rem]",
        className
      )}
    >
      {/* The origin light. Every mark comes out of this, and it is what
          the finished circle is arranged around. */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute size-1/2 rounded-full opacity-0 blur-2xl will-change-transform"
        // Inline, not a bg-[...] utility: glowTint is a runtime prop, and
        // Tailwind's arbitrary-value classes have to be static strings it
        // can see at build time — a template string interpolated into
        // one wouldn't be in the generated CSS at all.
        style={{ backgroundImage: `radial-gradient(circle, ${glowTint}, transparent 72%)` }}
      />

      {items.map((item, i) => (
        <div
          key={keyOf(item, i)}
          ref={(node) => {
            itemRefs.current[i] = node;
          }}
          className="absolute will-change-transform"
          // Starts collapsed at the centre. The composition is assembled
          // entirely by the effect above, so this is the state the server
          // renders and the state a first paint shows — nothing flashes
          // into its final position and then animates back. zIndex is
          // set once here rather than every frame in the layout loop —
          // it never changes per item, only the origin (index 0) needs
          // to stay above the rest so the set reads as surfacing from
          // behind it.
          style={{ opacity: 0, zIndex: i === 0 ? 2 : 1 }}
        >
          {renderItem(item, i)}
        </div>
      ))}
    </div>
  );
}
