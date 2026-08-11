"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * One right-angle corner bracket — the same mark a camera viewfinder uses
 * to frame a shot. `corner` controls which of the four it draws by
 * flipping the same base path, so there's one source of truth for the
 * stroke width/line-cap style instead of four hand-mirrored copies.
 */
function CornerBracket({
  corner,
  className,
  style,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      style={style}
      className={cn(
        "size-10 sm:size-12",
        corner === "tr" && "-scale-x-100",
        corner === "bl" && "-scale-y-100",
        corner === "br" && "scale-x-[-1] scale-y-[-1]",
        className
      )}
    >
      <path
        d="M2 26 V2 H26"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="square"
      />
    </svg>
  );
}

/** Thin-line stopwatch glyph — matches the corner brackets/crosshair's
 * stroke-only style rather than a filled Lucide icon. */
function StopwatchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M9 2h6M12 5v3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 10v4l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Thin-line battery glyph, three-quarters full — same stroke-only style. */
function BatteryIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 16" style={style} className={className}>
      <rect
        x="1"
        y="1"
        width="22"
        height="14"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
      />
      <rect x="24.5" y="5.5" width="2.5" height="5" rx="1" fill="currentColor" />
      <rect x="4" y="4" width="15" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

// How much scroll (px) it takes to fully fade the HUD symbols out. Not the
// borders/crosshair -- those stay at constant opacity, this only drives the
// REC+stopwatch cluster and the battery glyph.
const SYMBOL_FADE_DISTANCE = 420;

/**
 * Landing-page-only ambient backdrop, dressed as a camera's own recording
 * HUD: four corner brackets, a center crosshair, and — nested right into
 * the kink of the top-right and bottom-left brackets, reading as part of
 * the frame corner rather than a separate floating readout — a REC
 * indicator + stopwatch, and a battery glyph. The actual camera-app
 * chrome from the reference mockup is stripped out (the VIDEO/PHOTO
 * toggle, the record button, the gallery button, the flip-camera
 * button), since none of that means anything divorced from an actual
 * live camera.
 *
 * The stopwatch is a real ticking clock, not a frozen value — it reads as
 * a shot genuinely in progress rather than a static screenshot of one.
 *
 * The brackets/crosshair are fixed to the viewport the whole time, same
 * as SymbolField was, so the frame itself reads as constant depth behind
 * every section. The three HUD symbols (REC+stopwatch, battery) are
 * fixed the same way but fade out as the page scrolls — present for the
 * hero's first impression, then receding into the page rather than
 * staying a fixture the whole way down.
 *
 * Purely decorative: aria-hidden, pointer-events-none, low opacity so it
 * never competes with foreground text contrast — opaque section
 * backgrounds naturally cover it locally, which is fine, it's a page
 * texture, not content.
 */
export function ViewfinderFrame({ className }: { className?: string }) {
  const [elapsed, setElapsed] = useState(0);
  const [symbolOpacity, setSymbolOpacity] = useState(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onScroll() {
      const ratio = 1 - window.scrollY / SYMBOL_FADE_DISTANCE;
      setSymbolOpacity(Math.min(1, Math.max(0, ratio)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 overflow-hidden text-foreground/[0.24]",
        className
      )}
    >
      {/* top-24/lg:top-36, not top-6/top-8 like the bottom two: the navbar
          is sticky at the very top of the viewport for the entire time
          the page is visible (67px tall below `lg`, 120px at `lg`+ once
          the quick-jump pill row appears) -- unlike the bottom edge, which
          only sometimes has opaque content under it depending on scroll
          position, the top corners would be permanently hidden behind it
          at any smaller offset, not just "textured" like the rest of this
          layer is meant to be. */}
      <CornerBracket
        corner="tl"
        className="absolute top-24 left-6 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none sm:left-8 lg:top-36"
      />
      <CornerBracket
        corner="tr"
        className="absolute top-24 right-6 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none sm:right-8 lg:top-36"
        style={{ animationDelay: "-1.25s" }}
      />
      <CornerBracket
        corner="bl"
        className="absolute bottom-6 left-6 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none sm:bottom-8 sm:left-8"
        style={{ animationDelay: "-2.5s" }}
      />
      <CornerBracket
        corner="br"
        className="absolute right-6 bottom-6 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none sm:right-8 sm:bottom-8"
        style={{ animationDelay: "-3.75s" }}
      />

      {/* Center crosshair — the focus point every viewfinder centers a
          shot on, given the same slow breathing pulse as it'd have if a
          camera were continuously re-focusing on it. */}
      <svg
        viewBox="0 0 24 24"
        className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none"
      >
        <path
          d="M12 3v6M12 15v6M3 12h6M15 12h6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>

      {/* REC + stopwatch, nested into the top-right bracket's kink (its
          own top-24/lg:top-36 offset, just a touch further in from the
          edge). Fades out with scroll via symbolOpacity -- the bracket
          itself keeps its constant opacity untouched. */}
      <div
        className="absolute top-24 right-9 flex flex-col items-end gap-1 sm:right-11 lg:top-36"
        style={{ opacity: symbolOpacity }}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
          </span>
          <span className="text-[0.65rem] font-semibold tracking-wide">REC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StopwatchIcon className="size-3.5" />
          <span className="font-mono text-[0.65rem] tabular-nums">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>

      {/* Battery, nested into the bottom-left bracket's kink the same
          way. Own breathing pulse (like the corners/crosshair) nested
          inside the scroll-fade wrapper -- opacity from an animation and
          opacity from an inline style on the same element would fight
          each other, so the fade lives on this wrapper and the breathe
          animation stays on the icon itself; the two compose instead of
          conflicting. */}
      <div className="absolute bottom-9 left-9 sm:bottom-11 sm:left-11" style={{ opacity: symbolOpacity }}>
        <BatteryIcon className="h-3.5 w-auto animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
