"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { useScrolledPast } from "@/lib/use-scroll-y";
import { cn } from "@/lib/utils";

/**
 * The name tag: a small brand identifier pinned to the bottom of the
 * screen while you read.
 *
 * WHAT IT IS FOR. On a page this long the logo scrolls away in the first
 * second and never comes back until the footer. The tag is the brand
 * staying present without the navbar having to stay opaque and heavy —
 * it is chrome, but the smallest possible amount of it.
 *
 * IT HAS A JOB, WHICH IS WHY IT IS NOT DECORATION. Clicking it returns
 * you to the top. That matters on a document of this length, and it is
 * the difference between an interface element and a sticker: a thing in
 * the corner of the screen that cannot be used is something to ignore.
 *
 * BUILT TO A MEASURED SPEC. The proportions come from the reference
 * site's own bottom-of-screen badge, read off it in a browser rather than
 * guessed:
 *
 *   background   rgba(34,34,34,0.8)   → our surface-1 at 80%
 *   radius       8px
 *   padding      4px 8px              → widened slightly here, since our
 *                                       lockup carries a mark as well
 *   backdrop     blur(10px)
 *   type         12px / 500
 *   shadow       0 2px 4px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.05)
 *   inset        40px from the edge
 *
 * POSITION IS OURS, AND IT HAD TO BE. Theirs sits bottom-right. Both
 * bottom corners of our landing page are already occupied by the
 * viewfinder's corner brackets (site/viewfinder-frame.tsx), so a tag in
 * either one would collide with the page's own framing device. Centred,
 * it sits in the one part of the bottom edge that is deliberately empty,
 * it is symmetric with a page whose whole composition is centred, and on
 * a phone it stays clear of both thumb zones where a stray tap would
 * otherwise be an accident waiting to happen.
 *
 * WHEN IT IS VISIBLE. Not at the top — the navbar is already showing the
 * logo there, and two of them at once is just clutter. It fades in once
 * the hero is behind you, and fades out again as the footer arrives,
 * where the real logo takes over. Anything else would leave two logos on
 * screen at the same moment, twice.
 */
export function BrandTag() {
  // Past roughly one screen: far enough that the navbar's own logo has
  // gone, close enough that it arrives while the reader is still near the
  // top rather than appearing mysteriously in the middle of the page.
  const scrolledIn = useScrolledPast(560);
  const [nearFooter, setNearFooter] = useState(false);

  // Watches the footer rather than a hardcoded distance from the bottom:
  // page length changes with content, and a magic number would drift out
  // of true the first time a section was added.
  const observed = useRef(false);
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer || observed.current) return;
    observed.current = true;
    const observer = new IntersectionObserver(
      ([entry]) => setNearFooter(entry.isIntersecting),
      // Fires a little before the footer's top edge actually arrives, so
      // the handover happens while both are still off screen rather than
      // as a visible swap.
      { rootMargin: "160px 0px 0px 0px" }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const visible = scrolledIn && !nearFooter;

  return (
    <div
      className={cn(
        // Full-width, pointer-events-none wrapper so the tag can be
        // centred without an inline-size guess, while the strip either
        // side of it stays completely transparent to clicks. A fixed
        // element that eats input across the bottom of the page is a
        // genuine bug, not a styling detail.
        "pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center sm:bottom-10",
        "transition-[opacity,transform] duration-300 ease-[var(--ease-cinematic)]",
        "motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
      aria-hidden={!visible}
    >
      <button
        type="button"
        tabIndex={visible ? 0 : -1}
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          })
        }
        aria-label="On Camera — back to top"
        className={cn(
          "focus-premium group/tag pointer-events-auto flex items-center gap-2 rounded-[8px]",
          "border border-hairline bg-surface-1/80 px-2.5 py-1.5 backdrop-blur-[10px]",
          "shadow-[0_2px_4px_0_oklch(0_0_0_/_0.3),0_1px_2px_0_oklch(0_0_0_/_0.2)]",
          "transition-colors duration-300 ease-[var(--ease-cinematic)]",
          "hover:border-hairline-strong hover:bg-surface-2/80",
          // 44px is the smallest reliable thumb target; the tag itself is
          // ~30px tall, so the difference is made up in touch padding
          // rather than by inflating the visible pill on a phone.
          "min-h-[34px] sm:min-h-0"
        )}
      >
        <BrandMark live className="size-4 text-foreground/80" />
        {/* Same wordmark treatment as logo.tsx — see that file and
            layout.tsx for why Bricolage Grotesque, 700 (not the 500 the
            oversized footer lettering measures to — that weight only
            reads right at a size this small doesn't have), -0.04em. Two
            different fonts or weights on the same three words in two
            pieces of chrome would read as a mistake, not a variant. */}
        <span className="font-wordmark text-xs leading-none font-bold lowercase tracking-[-0.04em] text-foreground/90">
          on camera
        </span>
      </button>
    </div>
  );
}
