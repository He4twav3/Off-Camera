/**
 * Brands we've worked with — the data behind the orbiting logo ring
 * (components/marketing/brand-orbit.tsx).
 *
 * Every logo here is the company's own real mark, pulled from their own
 * site or favicon, not a redrawn or invented approximation. If a brand
 * is ever added without a real file, leave `logo` unset: BrandBadge
 * falls back to a plain monogram, which honestly reads as "no logo
 * supplied" instead of impersonating an identity that isn't theirs.
 *
 * `tone` is the one piece of per-brand presentation that can't be
 * automated. These marks arrive with wildly different assumptions about
 * what's behind them — a dark glyph on transparent, a light glyph on
 * transparent, a full-bleed colored tile — and on a near-black page a
 * dark-on-transparent mark is simply invisible. So each one declares
 * what it is and the badge adapts:
 *
 *   "light" — already light/colored enough to sit on dark. Render as-is.
 *   "dark"  — a dark mark on transparency. Inverted to read on dark.
 *   "tile"  — a self-contained tile that brings its own background.
 *             Rendered edge-to-edge so its own background fills the
 *             badge, instead of floating a colored square inside a
 *             circle with a ring of dead space around it.
 */
export type Brand = {
  name: string;
  /** Path under /public. Omit until a real logo file is available. */
  logo?: string;
  /** How the mark needs to be treated to read on a dark surface. */
  tone?: "light" | "dark" | "tile";
  /** Fallback shown when `logo` is absent. 1–2 characters. */
  monogram: string;
};

export const BRANDS: Brand[] = [
  { name: "Kyu Japan", monogram: "KY", logo: "/brands/kyu-japan.png", tone: "tile" },
  { name: "Parakeet AI", monogram: "PA", logo: "/brands/parakeet.png", tone: "light" },
  { name: "Clippie AI", monogram: "CL", logo: "/brands/clippie.png", tone: "tile" },
  { name: "Eromify", monogram: "ER", logo: "/brands/eromify.png", tone: "tile" },
  { name: "GPTZero", monogram: "GZ", logo: "/brands/gptzero.png", tone: "dark" },
];
