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
function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 16" className={className}>
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

/**
 * Landing-page-only ambient backdrop, dressed as a camera's own recording
 * HUD: four corner brackets, a center crosshair, a stopwatch that counts
 * up from page load (top-left), a pulsing REC indicator (top-right), and
 * a battery glyph (bottom-left) — with the actual camera-app chrome from
 * the reference mockup stripped out (the VIDEO/PHOTO toggle, the record
 * button, the gallery button, the flip-camera button), since none of
 * that means anything divorced from an actual live camera.
 *
 * The stopwatch is a real ticking clock, not a frozen value — it reads as
 * a shot genuinely in progress rather than a static screenshot of one.
 * That's the "dynamic" quality this is meant to have: the page itself is
 * always "recording."
 *
 * Fixed to the viewport like SymbolField was, so it reads as depth behind
 * every section at any scroll position rather than a band that ends
 * partway down. Purely decorative: aria-hidden, pointer-events-none, low
 * opacity so it never competes with foreground text contrast — opaque
 * section backgrounds naturally cover it locally, which is fine, it's a
 * page texture, not content.
 */
export function ViewfinderFrame({ className }: { className?: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
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

      {/* Stopwatch, top-left — the counterpart to REC at top-right, same
          offset so the two sit level with each other. Real elapsed time
          since load, not a frozen value. */}
      <div className="absolute top-24 left-16 flex items-center gap-1.5 sm:left-20 lg:top-36">
        <StopwatchIcon className="size-3.5" />
        <span className="font-mono text-[0.65rem] tabular-nums">
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Recording indicator, top-right — a live camera's actual "this is
          rolling" tell, pulsing the way a real one does. */}
      <div className="absolute top-24 right-16 flex items-center gap-1.5 sm:right-20 lg:top-36">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive" />
        </span>
        <span className="text-[0.65rem] font-semibold tracking-wide">REC</span>
      </div>

      {/* Battery, bottom-left — the fourth status readout a real
          recording HUD carries alongside the clock and the REC tally.
          Same breathing pulse as the corners/crosshair, just enough
          motion to read as "alive" rather than a static icon. */}
      <BatteryIcon className="absolute bottom-6 left-16 h-3.5 w-auto animate-[viewfinder-breathe_5s_ease-in-out_infinite] motion-reduce:animate-none sm:bottom-8 sm:left-20" />
    </div>
  );
}
