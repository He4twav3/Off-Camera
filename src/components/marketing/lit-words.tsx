"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A heading that lights up word by word as it arrives.
 *
 * This is the reference site's signature interaction, and the reason it
 * works is worth stating: the words don't slide, fade in from nothing,
 * or move at all. They're present and readable the entire time — they
 * just go from dim to lit, left to right, like a sentence being read
 * aloud. Nothing jumps, nothing reflows, and the heading is legible at
 * every single frame including the first.
 *
 * That property is what makes it usable on a *sales* page rather than
 * just a showreel. A headline is the one element you cannot afford to
 * animate badly: if it slides in, the reader waits; if it fades from
 * zero, a screenshot or a slow connection catches it blank. Lighting it
 * costs nothing if the animation never runs, because the resting state
 * of every word is simply "lit".
 *
 * On this page it also does structural work. Each section heading is a
 * step in the argument (Problem → Possibility → Proof → System →
 * Course → Action), and reading each one out in sequence rather than
 * dropping it in whole makes the page feel like it's being narrated as
 * you descend it — which is the "discovering the course as I scroll"
 * feeling, not "reading a long sales page".
 *
 * Implementation notes:
 *  - Renders real text in real word spans. No canvas, no character
 *    splitting, no duplicated hidden copy. Selectable, searchable, and
 *    read correctly by a screen reader as one continuous sentence.
 *  - Words are wrapped in `inline-block` spans, which would normally
 *    collapse the spaces between them — the explicit `{" "}` between
 *    words is load-bearing, not stray whitespace.
 *  - Animation is opacity only, on a per-word transition-delay. No
 *    per-word timers, no JS animation loop: one IntersectionObserver
 *    flips one boolean, and CSS does the rest.
 *  - Server-renders fully lit. JS only ever takes the light away, and
 *    only for content that hasn't been reached yet — the same rule the
 *    Reveal system already follows, for the same reason.
 *
 * `unit` picks the grain, and the two settings are a hierarchy rather
 * than a preference:
 *
 *   "word" — every section heading on the page. A heading is a step in
 *            the argument, and lighting it a word at a time reads as
 *            that step being spoken.
 *   "char" — the h1, and only the h1. Letter-by-letter is a slower,
 *            more deliberate arrival, which is right exactly once: the
 *            first line a visitor reads. Used on a heading further down
 *            it would be the same effect at the same intensity as the
 *            hero's, and the hero would stop being the biggest moment
 *            on the page.
 *
 * In "char" mode the split is still per-word first and per-character
 * inside each word — characters are never the wrapping unit, so a long
 * heading breaks between words exactly as normal text does rather than
 * mid-word.
 */
export function LitWords({
  children,
  className,
  /** Gap between consecutive units, ms. */
  step = 55,
  /** Delay before the first unit lights, ms. */
  delay = 0,
  /** What lights up at a time. See the note above — "char" is the h1 only. */
  unit = "word",
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  step?: number;
  delay?: number;
  unit?: "word" | "char";
  as?: "span" | "h1" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
  // Starts lit. See the note above: the un-lit state is applied by JS in
  // a layout effect only when the element genuinely hasn't been seen,
  // so the server payload and a no-JS render are both fully readable.
  const [lit, setLit] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    // Already scrolled past, or already on screen at mount — leave it
    // alone rather than dimming content the reader can see right now.
    if (rect.top < window.innerHeight * 0.92) return;

    setLit(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLit(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = children.split(" ");

  // Running index across the whole heading, so the delay ramp is
  // continuous rather than restarting inside every word.
  let unitIndex = 0;

  return (
    <Tag
      ref={ref as never}
      className={cn(className)}
      // The whole heading is one string to assistive tech; the per-unit
      // spans are a purely visual device.
      aria-label={children}
    >
      {words.map((word, w) => {
        // Each word is one inline-block so it wraps as a unit. In "char"
        // mode its characters are individually lit inside that box,
        // which is what keeps letter-by-letter from breaking words
        // across lines.
        const pieces = unit === "char" ? Array.from(word) : [word];
        return (
          // Outer span stays a plain inline box: the trailing space
          // below has to live outside the inline-block, or the box
          // collapses it and every word runs into the next one.
          <span key={`${word}-${w}`} aria-hidden>
            <span className="inline-block">
              {pieces.map((piece, p) => {
                const i = unitIndex++;
                return (
                  <span
                    key={`${piece}-${p}`}
                    className={cn(
                      "inline-block transition-opacity duration-300 ease-[var(--ease-cinematic)] motion-reduce:opacity-100 motion-reduce:transition-none",
                      lit ? "opacity-100" : "opacity-25"
                    )}
                    style={{ transitionDelay: lit ? `${delay + i * step}ms` : "0ms" }}
                  >
                    {piece}
                  </span>
                );
              })}
            </span>
            {/* Explicit space: the inline-block above eats normal
                whitespace between spans. */}
            {w < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </Tag>
  );
}
