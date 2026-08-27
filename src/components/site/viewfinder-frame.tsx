"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
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

/**
 * A corner bracket plus its own HUD symbol, sharing the bracket's own
 * coordinate box: the symbol sits diagonally inset from the same corner
 * the bracket kinks at (`insetClassName`), tucked just inside the angle
 * rather than out past the bracket entirely — the arms are only a 2.5px
 * stroke right at the edge, not a solid band, so a modest inset clears
 * them with real margin while still reading as nested inside this one
 * corner mark, not a separate floating readout.
 */
function CornerWithSymbol({
  corner,
  bracketDelay,
  positionClassName,
  insetClassName,
  symbolOpacity,
  children,
}: {
  corner: "tl" | "tr" | "bl" | "br";
  bracketDelay: string;
  positionClassName: string;
  insetClassName: string;
  symbolOpacity: number;
  children: ReactNode;
}) {
  return (
    <div className={cn("absolute", positionClassName)}>
      <div className="relative size-10 sm:size-12">
        <CornerBracket
          corner={corner}
          className="absolute inset-0 animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{ animationDelay: bracketDelay }}
        />
        <div className={cn("absolute", insetClassName)} style={{ opacity: symbolOpacity }}>
          {children}
        </div>
      </div>
    </div>
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
 * HUD: four corner brackets, a center crosshair, and — tucked diagonally
 * inside the same corner each bracket kinks at, not off past it — a
 * battery glyph at top-left and a REC indicator + stopwatch at top-right.
 * The actual camera-app chrome from the reference mockup is stripped out
 * (the VIDEO/PHOTO toggle, the record button, the gallery button, the
 * flip-camera button), since none of that means anything divorced from
 * an actual live camera.
 *
 * The stopwatch is a real ticking clock, not a frozen value — it reads as
 * a shot genuinely in progress rather than a static screenshot of one.
 *
 * The brackets/crosshair are fixed to the viewport the whole time, same
 * as SymbolField was, so the frame itself reads as constant depth behind
 * every section. The two HUD symbol clusters are fixed the same way but
 * fade out as the page scrolls — present for the hero's first impression,
 * then receding into the page rather than staying a fixture the whole
 * way down.
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
        "viewfinder-frame pointer-events-none fixed inset-0 overflow-hidden text-foreground/[0.34]",
        className
      )}
    >
      {/* top-20/lg:top-32, not top-6/top-8 like the bottom two: the navbar
          is sticky at the very top of the viewport for the entire time
          the page is visible (67px tall below `lg`, 120px at `lg`+ once
          the quick-jump pill row appears) -- this clears just the navbar,
          keeping the corners high and tight rather than pushed down to
          also dodge the hero's own badge/heading, which just traded one
          collision for another the deeper it went. Unlike the bottom
          edge, which only sometimes has opaque content under it depending
          on scroll position, the top corners would otherwise be
          permanently hidden behind the navbar, not just "textured" like
          the rest of this layer is meant to be.

          The *symbol* readouts inside each corner (battery / REC+timer)
          are `hidden` below 640px for exactly the reason above: on a
          phone, the hero's eyebrow line ends and its headline begins
          only ~28px apart, and the symbol cluster is taller than that
          gap — there is no vertical position for it that clears both.
          Confirmed by measuring: nudging it down far enough to clear the
          eyebrow lands it squarely on the headline's first line instead.
          The bracket itself has real room (it sits above the eyebrow
          with clearance to spare) and stays at every width; only the
          readable text inside it is what a phone-width hero has no space
          left for. */}
      <CornerWithSymbol
        corner="tl"
        bracketDelay="0s"
        positionClassName="top-20 left-6 sm:left-8 lg:top-32"
        insetClassName="top-4 left-4 hidden sm:block"
        symbolOpacity={symbolOpacity}
      >
        <BatteryIcon className="h-3.5 w-auto animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none" />
      </CornerWithSymbol>

      <CornerWithSymbol
        corner="tr"
        bracketDelay="-1.25s"
        positionClassName="top-20 right-6 sm:right-8 lg:top-32"
        insetClassName="top-4 right-4 hidden flex-col items-end gap-1 sm:flex"
        symbolOpacity={symbolOpacity}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            {/* Was --destructive (a warm red). This palette has no warm
                tone in it, and an error color used as decoration is the
                wrong signal anyway — it's the brand crimson now, the same
                accent as every other "live" mark on the page. */}
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-crimson-bright/70 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-crimson-bright" />
          </span>
          <span className="text-[0.65rem] font-semibold tracking-wide">REC</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StopwatchIcon className="size-3.5" />
          <span className="font-mono text-[0.65rem] tabular-nums">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </CornerWithSymbol>

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
    </div>
  );
}
