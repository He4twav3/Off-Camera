import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Ten hand-picked 3-color combos so neighboring video cards never land on
// the same palette by coincidence — each drifts through analogous-ish
// hues rather than a jarring hard-stop rainbow, staying in the same
// "sticker" chroma/lightness range as the rest of the site instead of
// looking neon.
const PALETTES: [string, string, string][] = [
  ["oklch(0.74 0.17 25)", "oklch(0.7 0.19 350)", "oklch(0.8 0.13 70)"], // terracotta / coral / amber — hero
  ["oklch(0.72 0.15 300)", "oklch(0.68 0.18 260)", "oklch(0.76 0.12 330)"], // violet / indigo / magenta — story
  ["oklch(0.76 0.14 90)", "oklch(0.7 0.18 40)", "oklch(0.66 0.16 20)"], // gold / terracotta / rust — m1
  ["oklch(0.7 0.16 175)", "oklch(0.65 0.18 220)", "oklch(0.78 0.11 140)"], // teal / blue / sage — m2
  ["oklch(0.73 0.18 330)", "oklch(0.68 0.2 300)", "oklch(0.8 0.13 10)"], // pink / purple / coral — m3
  ["oklch(0.78 0.14 100)", "oklch(0.7 0.17 55)", "oklch(0.65 0.15 30)"], // lime-gold / amber / rust — m4
  ["oklch(0.68 0.17 250)", "oklch(0.72 0.14 300)", "oklch(0.72 0.13 190)"], // indigo / violet / cyan — m5
  ["oklch(0.75 0.17 15)", "oklch(0.7 0.19 350)", "oklch(0.8 0.12 65)"], // red / pink / gold — m6
  ["oklch(0.71 0.15 160)", "oklch(0.65 0.17 205)", "oklch(0.78 0.11 100)"], // green / teal / lime — m7
  ["oklch(0.73 0.16 280)", "oklch(0.68 0.19 320)", "oklch(0.78 0.13 45)"], // purple / magenta / orange — m8
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
