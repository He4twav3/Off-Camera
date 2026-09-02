"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A heading that reveals left to right, like a curtain opening rather
 * than words lighting up.
 *
 * Was a per-word (and, on the h1 only, per-character) opacity fade —
 * "dim to lit," left to right, each unit on its own transition-delay.
 * Traded for a single horizontal wipe on request: one `clip-path` on the
 * whole heading, inset from the right edge and animating that inset from
 * 100% (nothing showing) to 0% (fully shown). Same idea, coarser grain —
 * the heading arrives as one continuous reveal instead of a sequence of
 * per-unit fades, and it means real, unsegmented text again: the old
 * version wrapped every word (and, in char mode, every letter) in its
 * own `inline-block` span with a `{" "}` glued back in between and an
 * `aria-label` fallback so a screen reader saw one sentence instead of
 * however many span fragments — none of that is needed once the reveal
 * is one clip-path on the element itself rather than N per-unit
 * opacities, so the DOM is just the heading's own real text now.
 *
 * `clip-path`, not `width`/`transform` + `overflow: hidden` on a
 * wrapper: a plain `inset()` shape transitions on the compositor the
 * same way `transform`/`opacity` do (no layout, no repaint of the text
 * itself as it animates), without needing an extra wrapper element just
 * to clip against.
 *
 * Same lifecycle the old version had, unchanged: server-renders fully
 * revealed (JS only ever takes the reveal away, and only for content
 * that hasn't been reached yet — a no-JS or slow-connection load must
 * never ship a hidden heading), one IntersectionObserver flips one
 * boolean, reduced-motion and "already on screen at mount" both skip
 * the whole thing and render straight to revealed.
 *
 * Speed comes from `as`, not a separate prop: the h1 gets the slower of
 * the two (the one deliberate moment on the page worth a beat longer —
 * see hero.tsx's own note on why char-mode used to be reserved for it
 * alone), everything else gets the faster one. Same hierarchy the old
 * unit="char"/"word" split encoded, one fewer prop to thread through
 * every call site to say it.
 */
const REVEAL_LINE = 0.92;

export function LitWords({
  children,
  className,
  /** Delay before the wipe starts, ms. */
  delay = 0,
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
  // Starts revealed. See the header note: the un-revealed state is
  // applied by JS in a layout effect only when the element genuinely
  // hasn't been seen yet, so the server payload and a no-JS render are
  // both fully readable.
  const [revealed, setRevealed] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    // Already scrolled past, or already on screen at mount — leave it
    // alone rather than wiping away content the reader can see right now.
    if (rect.top < window.innerHeight * REVEAL_LINE) return;

    setRevealed(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: `0px 0px -${Math.round((1 - REVEAL_LINE) * 100)}% 0px` }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The one deliberate exception: the hero's own h1 gets a slower, more
  // ceremonial wipe than every section heading below it, same hierarchy
  // the old letter-by-letter-vs-word-by-word split encoded (see the
  // header note) — reserved for the single biggest statement on the
  // page, not something a heading further down should also get at the
  // same intensity.
  const duration = Tag === "h1" ? 650 : 480;

  return (
    <Tag
      ref={ref as never}
      // No forced display value — h1/h2 stay block-level, same as a
      // plain heading would, so callers' own `mx-auto`/`max-w-*`/
      // `text-balance` centering keeps working exactly as it did before
      // this only ever wrapped the text in a plain string, not layout.
      className={cn("motion-reduce:transition-none", className)}
      style={{
        clipPath: revealed ? "inset(0 -10% 0 0)" : "inset(0 100% 0 0)",
        transitionProperty: "clip-path",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "var(--ease-cinematic)",
        transitionDelay: revealed ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}
