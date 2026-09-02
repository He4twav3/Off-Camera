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
 * automated. These marks arrive with wildly different assumptions about
 * what's behind them, and the badge has to pick a disc colour that lets
 * each one read in its own real colours — never desaturated, never
 * colour-inverted (inverting a mark with real brand colour in it doesn't
 * just flip light/dark, it wrecks the actual colours: a red icon inverts
 * to cyan). So each entry declares what its disc needs to be:
 *
 *   "onDark"  — the mark itself is light/white/pale enough to sit
 *               directly on this page's dark surface (--surface-2, a
 *               dark charcoal — not literal black).
 *   "onBlack" — same idea as "onDark", but a literal black disc rather
 *               than --surface-2's charcoal, for a mark specifically
 *               chosen to sit on true black.
 *   "onLight" — the mark relies on dark ink or has real colour that
 *               only reads correctly against a light background, so its
 *               disc is light instead of trying to force it onto dark.
 *   "tile"    — a self-contained tile that already brings its own
 *               background. Rendered edge-to-edge so that background
 *               fills the badge, instead of floating a colored square
 *               inside a circle with a ring of dead space around it.
 */
export type Brand = {
  name: string;
  /** Path under /public. Omit until a real logo file is available. */
  logo?: string;
  /** Which disc colour lets this mark read in its own real colours. */
  tone?: "onDark" | "onBlack" | "onLight" | "tile";
  /** Fallback shown when `logo` is absent. 1–2 characters. */
  monogram: string;
};

export const BRANDS: Brand[] = [
  // Background recoloured twice now, both times the flat colour field
  // only — the wordmark itself (shape, weight, the actual "KYU JAPAN"
  // glyphs) has never been touched. Brand blue -> black -> now white, on
  // request each time; white meant the white text would vanish into it,
  // so this pass is a plain full-image invert rather than a background-
  // only swap (black bg/white text -> white bg/black text) — safe only
  // because the source is genuinely 2-tone with no colour to wreck.
  // Still `tone: "tile"` — still a self-contained square brought in
  // edge-to-edge, just white instead of black now.
  { name: "Kyu Japan", monogram: "KY", logo: "/brands/kyu-japan.png", tone: "tile" },
  // Was a generic 48x48 grey chevron — some fallback/placeholder icon,
  // not Parakeet AI's own mark at all. Replaced with their real bird
  // icon (parakeet-ai.com/logo/logo-full-bird-square.png), the square
  // app-icon version of their logo rather than the wide wordmark, since
  // a square source is what actually fits this badge's disc. Real alpha
  // transparency around the bird, so the disc tone can just be swapped
  // outright (onBlack -> onLight, on request) with no image edit needed
  // for that part.
  //
  // The bird's own colours needed an edit, though: the real mark is a
  // light green parrot, mostly in this file's 160-224 luminance range
  // (measured) even before BrandBadge's shared grayscale filter touches
  // it, which read as a washed-out light grey on this disc's white —
  // exactly the "unmissable, then flat and pale" outcome the grayscale
  // pass elsewhere on this page manages to avoid on the higher-contrast
  // marks. Darkened per-pixel with a gamma curve (channel = (channel/
  // 255)^2.6 * 255, alpha untouched) before it ever reaches that
  // grayscale/contrast filter — a curve, not a flat multiply, so the
  // bird's own shading (the layered feather shapes) stays legible
  // instead of crushing to a flat silhouette; the already-light
  // face/eye patch stays closer to white throughout, which is what
  // keeps it reading as a bird and not an ink blot.
  { name: "Parakeet AI", monogram: "PA", logo: "/brands/parakeet.png", tone: "onLight" },
  // Swapped for the blue Trustpilot-hosted version of the same "C"
  // mark (consumersiteimages.trustpilot.net) — the old file was this
  // same glyph in flat black; this one carries the actual brand blue.
  { name: "Clippie AI", monogram: "CL", logo: "/brands/clippie.jpg", tone: "tile" },
  // Recoloured white bg / solid black "e", on request, replacing the
  // real pink gradient mark — went through a couple of intermediate
  // passes first (white bg + the original pink kept, then white bg +
  // the pink darkened) before landing here. The edge-reconstruction
  // technique that survived all of them: coverage per pixel from the
  // max RGB channel rather than perceptual luminance — luminance is
  // green-weighted, and this mark's magenta/pink has almost no green,
  // so it badly underestimated coverage right at the edge and produced
  // a visible dark fringe around the "e" the first time. max-channel
  // coverage is hue-agnostic and gave a clean anti-aliased edge; that
  // coverage value is now just blended straight between black and white
  // instead of a recovered/darkened colour.
  { name: "Eromify", monogram: "ER", logo: "/brands/eromify.png", tone: "tile" },
  // Was inverted (tone "dark") — a flat white silhouette that threw away
  // the mark's real two-tone charcoal/grey design. A light disc shows
  // the actual logo instead.
  { name: "GPTZero", monogram: "GZ", logo: "/brands/gptzero.png", tone: "onLight" },
  // Replaces the old Stateshift entry (see git history if that one's
  // ever needed back) — Stateshift had no real logo asset that fit this
  // badge's disc (see the note that used to be here); GetImg's favicon
  // is a real square SVG mark instead, straight from getimg.ai's own
  // /icons/favicon.svg, so it just works as a normal `logo` entry.
  { name: "GetImg", monogram: "GI", logo: "/brands/getimg.svg", tone: "tile" },
  // Black wordmark on its own yellow tile — full-bleed like the other
  // tiles. The source file was genuinely soft (a small image upscaled
  // to 800x800, not a JPEG-compression artifact), so it's been run
  // through an unsharp mask + a touch of contrast — same real logo and
  // colours, just recovering the crisp edge a vector original would
  // have had, not a different file. Untouched here: whether this file
  // is actually *this* "True Avenue" — a common enough name that a
  // websearch turns up an Italian fashion label and a real-estate firm
  // as well — worth confirming against wherever the original file came
  // from before trusting the mark beyond "sharper than it was".
  { name: "True Avenue", monogram: "TA", logo: "/brands/true-avenue.jpg", tone: "tile" },
  // Cantina Labs, Project25, Cosmos, Sternify were on the sideshift
  // portfolio too, but every logo the page served for them turned out
  // wrong on inspection — "Cantina Labs" resolved to Apple's own logo,
  // "Cosmos" to an unrelated travel company (Globus Cosmos) — so none of
  // the four are added here. A wrong mark is worse than no mark; see the
  // header note on why an invented/incorrect one is never an option.
  // Add these once you can confirm the right file for each directly.
];
