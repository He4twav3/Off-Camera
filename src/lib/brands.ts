/**
 * Brands we've worked with — the data behind the credibility ring
 * (components/marketing/brand-constellation.tsx).
 *
 * Every logo here is the company's own real mark, pulled from their own
 * profile/press assets, not a redrawn or invented approximation. If a
 * brand is ever added without a real file, leave `logo` unset: BrandBadge
 * falls back to a plain monogram, which honestly reads as "no logo
 * supplied" instead of impersonating an identity that isn't theirs.
 *
 * `tone` is the one piece of per-brand presentation that can't be
 * automated. Every mark here is grayscaled by BrandBadge itself (see
 * that component's own note on why: eight competing brand palettes
 * fighting the page's one accent colour), so `tone` isn't about a mark's
 * real colour at all — it's a pure lightness problem, picking a disc
 * that lets a grayscaled mark's *shape* still read (a light wordmark is
 * invisible on another light disc, a dark mark disappears on a dark
 * one). So each entry declares what its disc needs to be:
 *
 *   "onDark"  — the mark itself is light/white/pale enough to sit
 *               directly on this page's dark surface (--surface-2, a
 *               dark charcoal — not literal black).
 *   "onBlack" — same idea as "onDark", but a literal black disc rather
 *               than --surface-2's charcoal, for a mark specifically
 *               chosen to sit on true black.
 *   "onLight" — the mark relies on dark ink, or was too pale to survive
 *               grayscale legibly against a dark disc, so its disc is
 *               light instead of trying to force it onto dark.
 *   "tile"    — a self-contained tile that already brings its own
 *               background. Rendered edge-to-edge so that background
 *               fills the badge, instead of floating a colored square
 *               inside a circle with a ring of dead space around it.
 */
export type Brand = {
  name: string;
  /** Path under /public. Omit until a real logo file is available. */
  logo?: string;
  /** Which disc colour lets this mark's grayscaled shape read cleanly. */
  tone?: "onDark" | "onBlack" | "onLight" | "tile";
  /** Fallback shown when `logo` is absent. 1–2 characters. */
  monogram: string;
};

export const BRANDS: Brand[] = [
  { name: "Kyu Japan", monogram: "KY", logo: "/brands/kyu-japan.png", tone: "tile" },
  { name: "Parakeet AI", monogram: "PA", logo: "/brands/parakeet.png", tone: "onLight" },
  { name: "Clippie AI", monogram: "CL", logo: "/brands/clippie.jpg", tone: "tile" },
  { name: "Eromify", monogram: "ER", logo: "/brands/eromify.png", tone: "tile" },
  // Was inverted (tone "dark") — a flat white silhouette that threw away
  // the mark's real two-tone charcoal/grey design. A light disc shows
  // the actual logo instead.
  { name: "GPTZero", monogram: "GZ", logo: "/brands/gptzero.png", tone: "onLight" },
  // Black wordmark on its own yellow tile — full-bleed like the other tiles.
  { name: "True Avenue", monogram: "TA", logo: "/brands/true-avenue.jpg", tone: "tile" },
  // Cantina Labs, Project25, Cosmos, Sternify were on the sideshift
  // portfolio too, but every logo the page served for them turned out
  // wrong on inspection — "Cantina Labs" resolved to Apple's own logo,
  // "Cosmos" to an unrelated travel company (Globus Cosmos) — so none of
  // the four are added here. A wrong mark is worse than no mark; see the
  // header note on why an invented/incorrect one is never an option.
  // Add these once you can confirm the right file for each directly.
];
