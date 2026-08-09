import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Ten metallic 3-tone combos — titanium white through gunmetal, each with
// a slightly different cast (a touch cooler, a touch warmer, a hint of
// the reference material's own violet glint) rather than a different hue
// altogether, so neighboring frames read as distinct pours of the same
// liquid metal instead of a rainbow. Chroma stays near-zero throughout —
// this is the one place "different colors to accentuate them" and the
// strict black/charcoal/silver palette both have to hold at once.
const PALETTES: [string, string, string][] = [
  ["oklch(0.92 0.002 265)", "oklch(0.3 0.004 265)", "oklch(0.68 0.02 290)"], // hero — bright chrome / graphite / violet glint
  ["oklch(0.88 0.015 290)", "oklch(0.25 0.01 290)", "oklch(0.6 0.02 260)"], // story — cool violet-tinted chrome
  ["oklch(0.9 0.002 265)", "oklch(0.22 0.004 265)", "oklch(0.55 0.004 265)"], // m1 — neutral titanium
  ["oklch(0.85 0.01 250)", "oklch(0.28 0.006 250)", "oklch(0.65 0.015 220)"], // m2 — cool steel
  ["oklch(0.9 0.012 300)", "oklch(0.24 0.008 300)", "oklch(0.62 0.02 300)"], // m3 — violet chrome
  ["oklch(0.87 0.004 265)", "oklch(0.32 0.004 265)", "oklch(0.7 0.006 265)"], // m4 — bright steel
  ["oklch(0.84 0.014 240)", "oklch(0.2 0.008 240)", "oklch(0.58 0.016 260)"], // m5 — deep blue-grey
  ["oklch(0.91 0.006 30)", "oklch(0.26 0.004 30)", "oklch(0.64 0.01 30)"], // m6 — warm silver
  ["oklch(0.86 0.01 200)", "oklch(0.23 0.006 200)", "oklch(0.6 0.014 210)"], // m7 — cool teal-grey
  ["oklch(0.93 0.008 300)", "oklch(0.29 0.006 300)", "oklch(0.7 0.018 290)"], // m8 — bright violet chrome
];

/**
 * Wraps a video card in an actual bordering frame — not a glow behind
 * it — shaped to the video's own rectangle, filled with a slowly
 * drifting multi-color "liquid" pattern plus a diagonal glossy sheen
 * sweeping across it, so the border band itself reads as a flowing wet
 * material rather than a static colored line. `variant` picks one of ten
 * palettes so a run of frames (the curriculum list, the module grid)
 * reads as visibly different from its neighbors.
 */
export function LiquidFrame({
  variant = 0,
  radius = "1rem",
  thickness = "0.85rem",
  className,
  children,
}: {
  variant?: number;
  /** Corner radius of the inner video; the frame's own radius adds `thickness` on top. */
  radius?: string;
  /** How thick the liquid band is — it needs real width to read as flowing liquid rather than a thin colored line. */
  thickness?: string;
  className?: string;
  children: ReactNode;
}) {
  const [a, b, c] = PALETTES[((variant % PALETTES.length) + PALETTES.length) % PALETTES.length];
  return (
    <div
      className={cn("relative isolate", className)}
      style={
        {
          "--liquid-a": a,
          "--liquid-b": b,
          "--liquid-c": c,
          padding: thickness,
          borderRadius: `calc(${radius} + ${thickness})`,
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="liquid-frame-fill absolute inset-0 -z-10 rounded-[inherit]"
      />
      <div
        aria-hidden
        className="liquid-frame-sheen pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
      />
      <div
        className="relative overflow-hidden bg-card"
        style={{ borderRadius: radius }}
      >
        {children}
      </div>
    </div>
  );
}
