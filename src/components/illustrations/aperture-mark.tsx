import { cn } from "@/lib/utils";

/**
 * A camera aperture, drawn as real geometry.
 *
 * This replaces the cartoon mascot that used to sit in this corner. It
 * does the same compositional job — breaking the top edge of the card so
 * the block doesn't read as a plain rectangle — without the block then
 * reading as a children's product. Stroke-only, `currentColor`, no
 * fills: the same visual language as ViewfinderFrame's corner brackets
 * and crosshair, so every decorative mark on the page looks like it came
 * off the same camera.
 *
 * The blades are not eyeballed. A real iris is six straight blades whose
 * edges lie along the sides of the hexagonal opening, each extended
 * outward until it meets the barrel — so blade k runs from opening
 * vertex k, through vertex k+1, on to the barrel circle. Every path
 * below is that construction solved exactly (opening radius 8.5, barrel
 * radius 24, centre 32,32). Drawing six lines that merely converge on
 * the centre instead — the obvious-looking approximation — produces a
 * circle with an X scribbled through it, which is precisely what the
 * first attempt at this looked like.
 */
export function ApertureMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-foreground/40", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* barrel */}
      <circle cx="32" cy="32" r="30" strokeWidth={1} opacity={0.45} />
      <circle cx="32" cy="32" r="24" strokeWidth={1.4} />

      {/* six blade edges, clipped to the barrel */}
      <g strokeWidth={1.4} opacity={0.9}>
        <path d="M32.00 23.50 L8.54 37.05" />
        <path d="M24.64 27.75 L24.64 54.84" />
        <path d="M24.64 36.25 L48.10 49.80" />
        <path d="M32.00 40.50 L55.46 26.95" />
        <path d="M39.36 36.25 L39.36 9.16" />
        <path d="M39.36 27.75 L15.90 14.20" />
      </g>

      {/* the opening the blades form */}
      <polygon
        points="32.00,23.50 24.64,27.75 24.64,36.25 32.00,40.50 39.36,36.25 39.36,27.75"
        strokeWidth={1.6}
      />
    </svg>
  );
}
