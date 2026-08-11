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
}: {
  corner: "tl" | "tr" | "bl" | "br";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
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
 * Sitewide ambient backdrop: the same four-corner viewfinder framing and
 * center crosshair from the reference camera-app mockup, with every piece
 * of actual camera-app chrome stripped out (the VIDEO/PHOTO toggle, the
 * record button, the gallery button, the flip-camera button, the running
 * timer — none of those mean anything divorced from an actual live
 * camera, so keeping them would read as a broken/frozen screenshot
 * bolted to the page rather than a deliberate motif). What's left is the
 * part of that mockup that doubles as a real idea for this site: the page
 * itself framed like a shot, evoking the course's whole premise (make
 * content without stepping in front of the lens) without spelling it out.
 *
 * Fixed to the viewport like SymbolField was, so it reads as depth behind
 * every section at any scroll position rather than a band that ends
 * partway down. Purely decorative: aria-hidden, pointer-events-none, low
 * opacity so it never competes with foreground text contrast — opaque
 * section backgrounds naturally cover it locally, which is fine, it's a
 * page texture, not content.
 */
export function ViewfinderFrame({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 overflow-hidden text-foreground/[0.09]",
        className
      )}
    >
      <CornerBracket corner="tl" className="absolute top-6 left-6 sm:top-8 sm:left-8" />
      <CornerBracket corner="tr" className="absolute top-6 right-6 sm:top-8 sm:right-8" />
      <CornerBracket corner="bl" className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8" />
      <CornerBracket corner="br" className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8" />

      {/* Center crosshair — the focus point every viewfinder centers a
          shot on. */}
      <svg
        viewBox="0 0 24 24"
        className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2"
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
