import { cn } from "@/lib/utils";

/**
 * The brand mark: a viewfinder frame with the tally light burning in the
 * middle of it.
 *
 * WHY THIS SHAPE. It is the one image that says what the product is
 * without a word: a camera framing a shot, and the red lamp that means it
 * is recording. It is also already the site's own language rather than
 * something imported for the logo — the landing page is wrapped in
 * viewfinder corner brackets (site/viewfinder-frame.tsx) drawn with this
 * exact stroke weight and square cap, so the mark reads as the smallest
 * possible instance of a device the whole page is built around.
 *
 * WHY CORNERS RATHER THAN A CLOSED SQUARE. A closed rectangle with a dot
 * in it is a generic icon — it could be any app. Four detached corners
 * are unmistakably a viewfinder, and they survive scaling far better: at
 * 16px a thin closed box turns to mush, while four short strokes and a
 * dot stay separable. It is drawn on a 24-unit grid with 2-unit strokes,
 * so at 16px the strokes land near 1.33px and at 32px near 2.67px —
 * crisp at both ends of the range it actually gets used at.
 *
 * The frame inherits `currentColor` so the mark takes the colour of
 * whatever it sits in; only the tally is fixed, to the brand crimson. The
 * site has exactly one red in it — the CTA, the module ramp, the
 * countdown's live dot, and this — and --destructive is deliberately not
 * it, because that is the error colour.
 */
export function BrandMark({
  className,
  /** Pulse the tally, the way a real one does. On by default in chrome
   * that is always on screen; off where the mark is decorative or
   * repeated, since a page full of pulsing dots is a page with a fault. */
  live = false,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
    >
      {/* The four corners. Square caps, matching ViewfinderFrame's own
          brackets — a rounded cap here would read as a soft UI icon
          rather than as an optical instrument. */}
      <g
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
        opacity={0.9}
      >
        <path d="M3 8.5V3h5.5" />
        <path d="M15.5 3H21v5.5" />
        <path d="M21 15.5V21h-5.5" />
        <path d="M8.5 21H3v-5.5" />
      </g>

      {/* The tally. Sized to stay visible at 16px, where it is the one
          element carrying the colour. */}
      <circle cx="12" cy="12" r="2.75" fill="var(--crimson-bright)">
        {live && (
          <animate
            attributeName="opacity"
            values="1;0.45;1"
            dur="2.4s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}
