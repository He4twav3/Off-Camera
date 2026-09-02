"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal once the element's top crosses this fraction of the viewport
 * height. Deliberately a single shared constant: it drives both the
 * observer's rootMargin AND the fallback position check below, so every
 * element on the page reveals at exactly the same point on screen no
 * matter which path happened to fire it. Splitting these (an observer
 * `threshold` on one side, a hand-rolled ratio on the other) is how
 * sections start feeling subtly different from each other.
 */
const REVEAL_LINE = 0.92;

/** Gap between items in the on-load cascade (see scheduleLoadReveal).
 * 90ms, not the old 70: at 70 the first screen resolved as a single
 * hurried flush, at ~120 the wave starts feeling slow to arrive. 90 is
 * where each beat is individually perceptible and the whole first screen
 * still lands in well under a second. */
const LOAD_STEP = 90;

/**
 * If the page took longer than this to reach us, skip the on-load
 * cascade entirely and just leave the first screen visible. Past this
 * point the user has been looking at real content for a while, and
 * hiding it to replay an entrance reads as a bug, not a flourish —
 * exactly the failure this file has been bitten by before. Scroll
 * reveals for content further down still get set up as normal.
 */
const LOAD_ANIMATION_CUTOFF = 2000;

/**
 * Below this width, every authored delay gets cut in half at the moment
 * it's actually applied (see scaleDelayForViewport) — the wait before an
 * element starts arriving, not just how long the arrival itself takes.
 * A phone scrolls through a section in a fraction of the time a mouse
 * wheel does on a desktop monitor, so the same 680ms stagger tail that
 * reads as a deliberate cascade on a big screen reads as the page
 * lagging behind a thumb that's already moved on. 640, not a real
 * device breakpoint — this only needs to be "narrow enough that scroll
 * outruns the wave," and Tailwind's own `sm` (640) already draws that
 * line everywhere else in this file's neighboring components.
 */
const MOBILE_BREAKPOINT = 640;
const MOBILE_DELAY_SCALE = 0.5;

/**
 * Applied only inside the two post-mount reveal callbacks below (the
 * on-load cascade and the scroll watcher), never in the render body
 * itself. `state.delay` starts out as the plain, unscaled `delay` prop
 * on both the server and the client's first render — identical either
 * way, since `window` doesn't exist on the server — so scaling it there
 * instead would make the very first client render disagree with the
 * server-rendered markup and trip a hydration mismatch on this file's
 * one dynamic style attribute. Scaling it here instead, inside an
 * effect-triggered callback that by definition only ever runs after
 * mount, sidesteps that entirely: there is no server render to disagree
 * with at this point.
 */
function scaleDelayForViewport(delay: number): number {
  if (typeof window === "undefined") return delay;
  return window.innerWidth < MOBILE_BREAKPOINT
    ? Math.round(delay * MOBILE_DELAY_SCALE)
    : delay;
}

/**
 * Every un-revealed Reveal on the page, sharing ONE observer and ONE
 * scroll/resize listener between them rather than one of each per
 * instance — the landing page mounts ~79 of these, and 79 observers plus
 * 79 scroll listeners is real work on every frame of every scroll.
 * Entries remove themselves the moment they reveal, so this drains to
 * empty as the user reads down the page and the listeners come off
 * entirely once it's empty.
 */
const pending = new Map<Element, () => void>();
let observer: IntersectionObserver | null = null;

function reveal(el: Element) {
  const show = pending.get(el);
  if (!show) return;
  pending.delete(el);
  observer?.unobserve(el);
  show();
  if (pending.size === 0) stopListening();
}

/**
 * The safety net. This used to be a flat `setTimeout(reveal-everything,
 * 1200)`, which quietly broke the whole feature: 1.2s after load it
 * revealed every below-the-fold element on the page at once — including
 * ones 8000px down — while the user was still looking at the hero. By
 * the time you scrolled past the first section there was nothing left to
 * animate, so the page appeared to "stop revealing" partway down. The
 * protection it was meant to provide (never leave real content stuck
 * invisible if the observer doesn't fire) is real, but it has to be
 * position-aware to provide it: this re-checks where things actually are
 * and reveals only what has genuinely reached the reveal line.
 */
function checkPending() {
  for (const el of Array.from(pending.keys())) {
    if (el.getBoundingClientRect().top < window.innerHeight * REVEAL_LINE) {
      reveal(el);
    }
  }
}

/** Coalesces checkPending to at most once per animation frame — same
 * pattern as use-scroll-y.ts's own onScroll/flush, applied here for the
 * same reason. Without this, checkPending ran on every raw `scroll`
 * event, and unlike a component just reading one cached value, it reads
 * `getBoundingClientRect()` — a forced layout — for every still-pending
 * element (up to ~79 of them early on the page) on every single one of
 * those events. That's real jank while actively scrolling, worst right
 * when the most is still pending, which is also exactly when a visitor
 * is scrolling fastest through the top of the page. */
let checkFrame = 0;
function scheduleCheck() {
  if (checkFrame) return;
  checkFrame = requestAnimationFrame(() => {
    checkFrame = 0;
    checkPending();
  });
}

function stopListening() {
  window.removeEventListener("scroll", scheduleCheck);
  window.removeEventListener("resize", scheduleCheck);
  if (checkFrame) {
    cancelAnimationFrame(checkFrame);
    checkFrame = 0;
  }
}

function watch(el: Element, show: () => void) {
  if (pending.size === 0) {
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck, { passive: true });
  }
  pending.set(el, show);

  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target);
      }
    },
    // threshold 0 + a bottom inset of exactly (1 - REVEAL_LINE): fires
    // the instant any part of the element crosses the same line
    // checkPending() uses.
    { threshold: 0, rootMargin: `0px 0px -${Math.round((1 - REVEAL_LINE) * 100)}% 0px` }
  );
  observer.observe(el);

  return () => {
    pending.delete(el);
    observer?.unobserve(el);
    if (pending.size === 0) stopListening();
  };
}

/**
 * The on-load cascade, for everything sitting in the first screen.
 *
 * These can't use their authored `delay` props: those restart from 0 in
 * every section, so on a viewport tall enough to show two sections at
 * once the second section's first item (Stats' "15M+ views", delay 0)
 * fires at the same moment as the first section's first line — and the
 * hero's own pull-quote (delay 440) lands *after* the view counts below
 * it. Ordering the whole first screen by actual vertical position
 * instead makes it read as one continuous wave from the top of the page
 * downward, which is the point.
 *
 * Batched across every instance via a double rAF: each Reveal registers
 * itself during its own layout effect, then the batch is sorted and
 * released together once they've all mounted and layout has settled.
 */
let loadBatch: { el: Element; show: (delay: number) => void }[] = [];
let loadScheduled = false;

function scheduleLoadReveal(el: Element, show: (delay: number) => void) {
  loadBatch.push({ el, show });
  if (loadScheduled) return;
  loadScheduled = true;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const batch = loadBatch;
      loadBatch = [];
      loadScheduled = false;

      const tops = new Map(batch.map((item) => [item, item.el.getBoundingClientRect().top]));
      batch.sort((a, b) => tops.get(a)! - tops.get(b)!);

      let step = 0;
      let previousTop = -Infinity;
      for (const item of batch) {
        // Items sharing a row (the stat tiles, the three belief cards)
        // shouldn't each cost a step — they're one beat of the wave, so
        // they go together and the next row picks up after them.
        const top = tops.get(item)!;
        if (top > previousTop) {
          step += 1;
          previousTop = top;
        }
        item.show((step - 1) * LOAD_STEP);
      }
    });
  });
}

/**
 * Fades + lifts its children into place — as one continuous wave down
 * the first screen on load, then per-element as they scroll into view
 * below that. Once revealed, an element stays revealed: one-time, no
 * re-triggering. This used to re-trigger on every scroll pass (enter/exit
 * toggling, then a more elaborate one-way-journey-with-top-reset
 * version), which kept causing real bugs as more of the page picked up
 * per-item reveals: cards failing to reveal after an unrelated horizontal
 * scroll inside the curriculum's pipeline strip, elements landing stuck
 * invisible depending on scroll direction/position at mount, and general
 * fragility from tracking scroll direction and page-top state across
 * dozens of instances. A one-time reveal has none of that surface area —
 * once an element has been shown, there's no more logic that can hide it
 * again by mistake.
 *
 * Wraps server-rendered section content from the outside (page.tsx) or is
 * used directly inside a component for per-item stagger, so the content
 * itself doesn't need to become a client component.
 *
 * Renders VISIBLE on the server and hides itself client-side in a LAYOUT
 * effect, before the browser paints — so the hidden state is what's
 * painted, with no flash of content appearing and then being taken away.
 * The server-visible default is the important half: this used to render
 * hidden (opacity-0) until JS proved otherwise, which meant every section
 * shipped invisible in the raw HTML and stayed that way until hydration
 * caught up. On a slow connection that left the page showing nothing but
 * its own background. A decorative entrance must never be able to do
 * that, so "visible" is what goes over the wire, JS only ever takes
 * content away, and even that is skipped once the page has been up long
 * enough for the user to be reading it (LOAD_ANIMATION_CUTOFF).
 */
/**
 * The three entrances the whole page is built from. Deliberately three
 * and not "whatever each section felt like": a consistent, restrained
 * vocabulary is the difference between a page that feels choreographed
 * and one that feels like an animation showcase.
 *
 *   rise  — the default. Type, list rows, small chips.
 *   lift  — cards and whole blocks. A little further, a little slower,
 *           and a barely-there scale so the element reads as coming
 *           *forward* out of the page rather than sliding up it.
 *   fade  — media, embeds, anything with an iframe in it. Opacity only:
 *           transforming a third-party embed mid-load makes it repaint
 *           and sometimes flicker, and it is not worth it.
 *
 * ON THE DURATIONS — these were retuned down, hard, and it is the single
 * biggest reason the page stopped reading as cheap. They used to be
 * 820ms (rise), 1000ms (lift) and 900ms (fade), with a 40px lift travel,
 * chosen to feel "cinematic". They did not read as cinematic; they read
 * as slow. Measured against the UI motion guidance this project checked
 * itself against, every one of them was two to three times over the
 * ceiling: micro-interactions want 150–300ms, UI transitions should not
 * exceed 500ms, and a standard scroll reveal is 400–600ms travelling
 * 16–24px. `duration-1000` is cited there, by name, as the anti-pattern.
 *
 * That is the actual mechanism behind "expensive" motion: it is fast and
 * precise, not slow and floaty. A long ease-out spends most of its
 * runtime almost-but-not-quite arrived, which the eye reads as the page
 * struggling. Halving the durations and cutting the travel roughly in
 * half with them keeps every entrance legible while making the whole
 * page feel like it responds instantly.
 *
 * Every one of them uses the same expo-out curve (--ease-cinematic,
 * cubic-bezier(0.16, 1, 0.3, 1)) with no overshoot anywhere. Bounce is
 * the single most "playful" thing motion can do, so there is none of it.
 */
/**
 * `max-sm:duration-[...]` on each of these — a plain CSS media query, not
 * a JS viewport check — knocks the arrival itself down by roughly the
 * same ~30% below 640px, on top of scaleDelayForViewport's own cut to
 * the wait beforehand. Deliberately done as a static class, not JS state
 * threaded down from here: unlike the delay (an inline style, only ever
 * touched post-mount — see scaleDelayForViewport's own note), a
 * conditional class the browser resolves from its own media query can't
 * disagree between server and client in the first place, so there's no
 * hydration hazard here to design around.
 */
const VARIANTS = {
  rise: {
    hidden: "translate-y-4 opacity-0",
    duration: "duration-[420ms] max-sm:duration-[300ms]",
  },
  lift: {
    hidden: "translate-y-5 scale-[0.99] opacity-0",
    duration: "duration-[500ms] max-sm:duration-[350ms]",
  },
  fade: {
    hidden: "opacity-0",
    duration: "duration-[450ms] max-sm:duration-[320ms]",
  },
} as const;

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: keyof typeof VARIANTS;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ visible: true, delay });

  // Read inside the effect without making it a dependency: this is the
  // authored value for the scroll-reveal path and never changes in
  // practice, and re-running the effect would re-arm a finished reveal.
  // Synced in its own layout effect, not during render — mutating a ref
  // directly in the render body is exactly what react-hooks/refs flags,
  // even for this "keep a ref in sync with the latest prop" pattern.
  const delayRef = useRef(delay);
  useLayoutEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Already scrolled past entirely — a refresh or reopen can restore
    // scroll position partway down the page, and replaying an entrance
    // for content the user has already read (or flashing it back in via
    // a fallback) is pure noise. Leave it alone.
    if (rect.bottom <= 0) return;

    const onFirstScreen = rect.top < viewportHeight;

    // Page has been up a while — see LOAD_ANIMATION_CUTOFF. Don't touch
    // anything already on screen; still arm the scroll reveal for the
    // content below, which the user hasn't reached yet either way.
    if (onFirstScreen && performance.now() > LOAD_ANIMATION_CUTOFF) return;

    setState({ visible: false, delay: 0 });

    if (onFirstScreen) {
      scheduleLoadReveal(el, (loadDelay) =>
        setState({ visible: true, delay: scaleDelayForViewport(loadDelay) })
      );
      return;
    }

    return watch(el, () =>
      setState({ visible: true, delay: scaleDelayForViewport(delayRef.current) })
    );
  }, []);

  const motion = VARIANTS[variant];

  return (
    <div
      ref={ref}
      // Children can hang their own animation off this without opening a
      // second observer: `group-data-[revealed=true]/reveal:...` fires a
      // line drawing itself, a rail scaling in, a node lighting up, at
      // the exact moment its section arrives. Before this, anything more
      // elaborate than "fade and lift the whole block" meant a component
      // growing its own IntersectionObserver and its own timing — which
      // is precisely how a page ends up with five different stagger rates
      // and no shared rhythm.
      data-revealed={state.visible ? "true" : "false"}
      style={{
        transitionDelay: state.visible ? `${state.delay}ms` : "0ms",
        transitionTimingFunction: "var(--ease-cinematic)",
      }}
      className={cn(
        "group/reveal transition-[opacity,transform] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none",
        motion.duration,
        // will-change only while there is still something to animate. The
        // landing page mounts ~80 of these; promoting all of them to their
        // own compositor layer permanently is real memory, for elements
        // that will never move again after their one entrance.
        state.visible
          ? "translate-y-0 scale-100 opacity-100"
          : cn("will-change-[opacity,transform]", motion.hidden),
        className
      )}
    >
      {children}
    </div>
  );
}
