"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { MODULE_ICONS } from "@/components/marketing/module-icons";
import { MODULE_SHADES, TOTAL_MODULES } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

/**
 * The eight things that decide whether a video works.
 *
 * WHAT THIS REPLACED. A ruled table of eight rows, each pairing a term
 * with a two-line paragraph — roughly two hundred words of body copy in
 * one flat grey block, at the exact point in the page where someone is
 * deciding whether they want this. It read as a reference table, and
 * nobody has ever been talked into anything by a reference table.
 *
 * ONE DESIGN, ADAPTED — not two. Eight chips and one answer panel, at
 * every width. What changes between a phone and a desktop is the
 * ergonomics of the same thing, never the thing:
 *
 *   The chips are a single sideways-scrolling row on a phone and a
 *   wrapped, centred cluster from `sm` up. Eight chips wrapped onto a
 *   390px screen become three or four rows of chrome sitting on top of
 *   the panel; one scrolling row keeps the answer where the thumb
 *   expects it.
 *
 *   Tap targets go to 44px tall below `sm`. At the desktop size they are
 *   34px, which is comfortable for a cursor and a real miss-rate for a
 *   thumb.
 *
 *   Selection is by hover OR tap OR keyboard focus OR — on a phone only —
 *   scroll position, so it responds to whatever the visitor actually has.
 *   Hover costs nothing on a desktop, so browsing is free there; a phone
 *   has no hover, so the chip nearest the row's centre selects itself as
 *   you swipe past it, the same free-browsing feel translated to touch.
 *   A tap still works too, it just isn't the only way in any more. See
 *   the scroll-spy effect below — it does nothing at `sm` and up, where
 *   the row wraps and stops scrolling.
 *
 * SHORT, ALWAYS. Every line is nine to twelve words, written to be read
 * in a breath. A paragraph explains; a line lands. If one needs a second
 * sentence to make sense, the fix is a better first sentence — the moment
 * these become paragraphs this is the old table again.
 *
 * COLOURED, ALWAYS. The accent's own module ramp (MODULE_SHADES) runs
 * at length here. This is one of only two places on the page where the
 * accent does that — the curriculum is the other — and it earns it the
 * same way: these are eight ordered stages of one system, and the ramp is
 * what says so.
 *
 * NOTHING HERE TEACHES THE MECHANISM. PRODUCT_VISION.md §13 draws that
 * line — the public page says what you will learn and why it matters,
 * never how it actually works. "One second to stop a thumb" is the
 * subject; the hook categories and the psychology behind them are the
 * course.
 */

/** Each entry is anchored to one real module, in curriculum order — the
 * module and its real `description` from curriculum.ts sit in the comment
 * above it so the line can be checked against its source by eye. */
const beats: { term: string; line: string }[] = [
  // m1 Hook — "How to make someone stop scrolling in the first second."
  { term: "The first second", line: "One second to stop a thumb. That second is writeable." },
  // m2 Retention — "Structuring a video so people keep watching."
  { term: "Staying watched", line: "They stopped scrolling. Now don't lose them at second three." },
  // m3 Volume — "Why more attempts beats chasing one 'perfect' video."
  { term: "More than one try", line: "Five rough attempts beat one perfect video. Every time." },
  // m4 Consistency — "Why one good video isn't a strategy."
  { term: "Showing up weekly", line: "One good video is luck. A schedule is a system." },
  // m5 Timing & Distribution — "What actually influences early reach."
  { term: "When you post", line: "Half of what you've heard about this is folklore." },
  // m6 Iteration — "Learning from what performs."
  { term: "When it flops", line: "A dead post isn't a verdict. It's data for the next one." },
  // m7 Content Formats — "On camera, not showing your face, silent, UGC."
  { term: "What's on screen", line: "Your face, just your hands, or no talking at all." },
  // m8 Monetization — "Turning content that performs into opportunities."
  { term: "Getting paid", line: "Brands pay creators who can prove the thing works." },
];

/** How long each beat holds before the next arrives, on pointer devices.
 * Slow enough to read the line twice. */
const ADVANCE_MS = 3400;

export function Outcomes() {
  const [active, setActive] = useState(0);
  /** Latched the first time anyone touches it, and never released. Once
   * someone has taken control, taking it back is the section arguing
   * with them. */
  const [taken, setTaken] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  /** Mirrors `active` for the scroll-spy effect below, which reads it
   * inside a scroll handler that's attached once and never re-attached —
   * reading `active` itself there would close over a stale value. */
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (taken) return;
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only advance while actually on screen — an interval firing behind
    // the user's back for a section they scrolled past ten minutes ago is
    // work nobody asked for.
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearInterval(timer);
        if (entry.isIntersecting) {
          timer = window.setInterval(
            () => setActive((i) => (i + 1) % beats.length),
            ADVANCE_MS
          );
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [taken]);

  function choose(index: number) {
    setActive(index);
    setTaken(true);
  }

  // The phone's answer to hover: there's no cursor to linger with, so
  // whichever chip is nearest the scrollable row's own centre becomes
  // active as you swipe, live, without a tap. Does nothing at `sm` and
  // up, where the row switches to `overflow-visible` and wraps instead
  // of scrolling — no scroll events ever fire there, so this never
  // touches the desktop, hover-driven behaviour at all.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pending = false;

    function pickNearest() {
      pending = false;
      const rowRect = row!.getBoundingClientRect();
      const centerX = rowRect.left + rowRect.width / 2;
      let nearest = 0;
      let nearestDist = Infinity;
      chipRefs.current.forEach((chip, i) => {
        if (!chip) return;
        const rect = chip.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - centerX);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      });
      if (nearest !== activeRef.current) choose(nearest);
    }

    // rAF-throttled: `scroll` can fire many times a frame during a fling,
    // and reading getBoundingClientRect on eight chips is layout work
    // worth doing at most once per frame, not once per event.
    function onScroll() {
      if (pending) return;
      pending = true;
      frame = requestAnimationFrame(pickNearest);
    }

    row.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      row.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const shade = MODULE_SHADES[active % MODULE_SHADES.length];
  const Icon = MODULE_ICONS[active];

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8"
    >
      <SectionHeader
        index="03"
        eyebrow="What changes for you"
        title="It's only eight things"
        lede={`Everything that decides whether a video works comes down to ${TOTAL_MODULES} of them. Here they are, in plain English.`}
      />

      <div className="mx-auto mt-14 max-w-3xl">
        <Reveal>
          {/* One row on a phone, scrolling sideways; wrapped and centred
              from `sm` up. Eight chips wrap to three or four rows on a
              390px screen, which puts a block of chrome above the thing
              you actually came to read — a single scrolling row keeps the
              panel where the thumb expects it. The negative margin lets
              the row bleed to both screen edges inside a padded section,
              so the next chip is cut off by the edge of the screen rather
              than by a margin: that sliver is the entire "there is more
              this way" affordance.

              touch-pan-x locks a drag started here to the horizontal
              axis, so a swipe across the chips can't wander into a
              vertical page scroll halfway through. */}
          <div
            ref={rowRef}
            className="no-scrollbar -mx-4 flex touch-pan-x snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
          >
            {beats.map((beat, i) => {
              const chipShade = MODULE_SHADES[i % MODULE_SHADES.length];
              const isActive = i === active;
              return (
                <button
                  key={beat.term}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => choose(i)}
                  // Mouse only. `onMouseEnter` fires on a touch tap too
                  // in some browsers, which would make a swipe across the
                  // chips select every one it passed under.
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") choose(i);
                  }}
                  onFocus={() => choose(i)}
                  aria-pressed={isActive}
                  className={cn(
                    // min-h-11 is 44px — the smallest thing a thumb hits
                    // reliably. The chips were 34px tall, which is fine
                    // for a cursor and a genuine miss-rate on a phone.
                    "focus-premium flex min-h-11 shrink-0 snap-start cursor-pointer items-center rounded-full border px-4 text-[0.8rem] font-semibold whitespace-nowrap transition-all duration-300 ease-[var(--ease-cinematic)] sm:min-h-0 sm:py-2",
                    // Flat, deliberately: no inset sheen, no glow, just
                    // the ramp's own solid fill and a transparent border —
                    // the same "solid fill only" constraint the CTA
                    // button follows (globals.css's own note on
                    // btn-cta), applied here too rather than left as a
                    // one-off glossy exception.
                    isActive
                      ? "border-transparent"
                      : "border-hairline bg-surface-1/70 text-muted-foreground hover:border-hairline-strong hover:text-foreground"
                  )}
                  // The ramp, applied as a real fill on the selected chip.
                  // Inactive chips stay neutral: eight filled accent pills
                  // at once would be a colour bar, and the accent stops
                  // meaning "this one" the moment everything has it.
                  style={
                    isActive
                      ? { backgroundColor: chipShade.bg, color: chipShade.text }
                      : undefined
                  }
                >
                  {beat.term}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* One line, big, lit — with a fixed minimum height so the chips
            above never jump when a shorter line replaces a longer one. */}
        <Reveal variant="lift" delay={BEAT.step} className="mt-10">
          <div className="card-premium relative flex min-h-[12rem] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-surface-1 px-6 py-12 text-center sm:px-12">
            {/* A pool of the active module's own colour behind the line —
                the accent as light rather than as a border. It re-tints as
                the beat changes, which is most of what makes the change
                register as movement rather than as a text swap. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 h-56 blur-3xl transition-colors duration-400 ease-[var(--ease-cinematic)]"
              style={{
                background: `radial-gradient(ellipse at center, ${shade.bg} 0%, transparent 70%)`,
                opacity: 0.4,
              }}
            />

            <Icon
              key={`icon-${active}`}
              className="relative mb-5 size-5 animate-in fade-in zoom-in-50 duration-300"
              style={{ color: shade.text }}
              strokeWidth={1.75}
            />

            {/* Keyed on the active index so React swaps the node instead of
                mutating it — which is what lets the whole line fade up as
                one piece rather than the characters changing underneath a
                static box. */}
            <p
              key={active}
              className="text-lit relative animate-in text-xl leading-snug font-semibold tracking-[-0.02em] text-balance duration-400 fade-in slide-in-from-bottom-2 sm:text-[1.65rem]"
            >
              {beats[active].line}
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={BEAT.lede}>
        <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground sm:max-w-none">
          That&apos;s the whole list.{" "}
          <span className="text-foreground">
            Below is the module that teaches each one.
          </span>
        </p>
      </Reveal>
    </section>
  );
}
