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

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

/**
 * Sitewide ambient backdrop: the four-corner viewfinder framing, center
 * crosshair, and running timer from the reference camera-app mockup, with
 * the actual app chrome stripped out (the VIDEO/PHOTO toggle, the record
 * button, the gallery button, the flip-camera button) — none of those
 * mean anything divorced from an actual live camera, so keeping them
 * would read as a broken/frozen screenshot bolted to the page rather than
 * a deliberate motif.
 *
 * The timer isn't frozen at a fixed value the way the reference shows it
 * — it actually counts up from the moment the page loads, and the top-
 * right REC dot pulses, so the whole thing reads as a shot genuinely in
 * progress rather than a static screenshot of one. That's the "dynamic"
 * quality this is meant to have: the page itself is always "recording."
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
        "pointer-events-none fixed inset-0 overflow-hidden text-foreground/[0.16]",
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

      {/* Running timer, bottom-center between the two bottom brackets —
          real elapsed time since load, not the reference's frozen value. */}
      <span className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs tabular-nums sm:bottom-10">
        {formatElapsed(elapsed)}
      </span>

      {/* Recording indicator, top-right — a live camera's actual "this is
          rolling" tell, pulsing the way a real one does. Sits just inside
          the top-right corner bracket, echoing where a real camera app
          would place it. */}
      <div className="absolute top-24 right-16 flex items-center gap-1.5 sm:right-20 lg:top-36">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive" />
        </span>
        <span className="text-[0.65rem] font-semibold tracking-wide">REC</span>
      </div>
    </div>
  );
}
