/**
 * The oversized brand lettering at the bottom of the footer.
 *
 * BUILT TO THE REFERENCE SITE'S OWN VERSION OF THIS, MEASURED RATHER THAN
 * EYEBALLED. Their footer carries a huge "Parley" wordmark behind the
 * copyright line — a single line, spanning the full width of their
 * container, overflow-clipped by a window shorter than the lettering
 * itself so only the top portion (cap height and x-height; the baseline
 * curve and the descender) survives the clip. It reads as the name
 * sinking below the bottom edge of the page rather than sitting on it.
 *
 * THE FONT is Bricolage Grotesque at weight 500, tracking -0.04em — see
 * layout.tsx for how that was identified (their navbar logo turned out to
 * be an unrelated stock asset; this was measured from their actual
 * footer lettering instead, and confirmed against the same face already
 * doing the same job elsewhere on their page). The same pair drives the
 * wordmark in logo.tsx, so this reads as the same name at a different
 * scale rather than a second, competing lettering style.
 *
 * ONE LINE, DELIBERATELY WIDER THAN THE CONTAINER. Their word is six
 * characters; "on camera" is nine. Matching their font-size verbatim
 * would either overflow badly or, held to fit, shrink until it stopped
 * reading as oversized — so the size here is fluid (vw-based, clamped)
 * rather than a fixed number lifted from their pixels, and it is tuned
 * to run a little past 100% of the container rather than stopping short
 * of it. Their asset covers its box the same way (object-fit: cover, not
 * contain) — the letters are meant to fill the area, not sit centred
 * inside it with room to spare either side. `overflow-hidden` on this
 * wrapper (plus the marketing scope's own overflow-x-clip as a backstop)
 * absorbs the small horizontal excess the same way it absorbs the
 * vertical crop below.
 *
 * THE CROP is done in em rather than px on purpose: a negative bottom
 * margin on the line pulls its own box up past this wrapper's bottom
 * edge, and `overflow-hidden` clips whatever crosses it. Sized in em, it
 * scales with the fluid font-size at every breakpoint without a second
 * measurement to keep in sync — no separate px window the way their
 * fixed 235px one is.
 *
 * THE COLOUR is not their cream-on-cream — that was a literal near-match
 * to their flat footer background, which this site doesn't have (ours is
 * translucent and blurred, not a flat fill). The equivalent here is the
 * same move applied to our own palette: the existing --foreground token
 * at very low opacity, so it reads as barely-there texture rather than a
 * new colour. No new colour is introduced.
 *
 * THE MOSAIC. Their version doesn't stop at the lettering — a scatter of
 * small squares sits across it too, like tiles missing from the word
 * rather than a texture laid over it. Rather than their thirteen
 * identically-sized, loosely-scattered tiles, these six are placed at
 * actual letter centres in "on camera" (re-measured against the rendered
 * glyph boxes after the name changed from "off camera" — a Playwright
 * range-per-character pass against the live page, not eyeballed either
 * time) and
 * biased toward the crop line at the bottom — so each one reads as a
 * piece missing from a specific letter, concentrated where the word is
 * already sinking out of view, rather than confetti scattered irrespective
 * of what is under it. Sizes and opacities vary rather than repeat, for
 * the same reason: a uniform grid reads as a texture, an irregular one
 * reads as damage. Their colour was the accent orange this whole site
 * remaps to the brand crimson everywhere else (see footer.tsx's own
 * colour note); this follows that same mapping rather than introducing a
 * colour of its own.
 *
 * `aria-hidden`: the name is already read by the actual logo and the
 * copyright line right below this. A screen reader does not need it a
 * second time, oversized, with squares missing from it.
 */
const MOSAIC = [
  // over the "o" of "on" — early, high, small
  { left: "6.5%", top: "58%", size: "0.14em", opacity: 0.9 },
  // over the "n" — right on the crop line
  { left: "19.7%", top: "88%", size: "0.2em", opacity: 1 },
  // over the "a" of "camera" — faint, mid-letter
  { left: "49.4%", top: "62%", size: "0.12em", opacity: 0.6 },
  // over the "m" — on the crop line
  { left: "65.6%", top: "90%", size: "0.16em", opacity: 0.85 },
  // over the "r" — faint, mid-letter
  { left: "92.3%", top: "60%", size: "0.11em", opacity: 0.5 },
  // over the final "a" — on the crop line
  { left: "102.6%", top: "87%", size: "0.18em", opacity: 0.75 },
] as const;

export function FooterWordmark() {
  return (
    // -mx-5/-mx-6/-mx-8 (what this used to be) only cancelled this row's
    // own padding inside footer.tsx's max-w-[1240px] container — the
    // wordmark's own box was still never wider than that 1240px column,
    // so on any screen wider than it (basically every desktop) there was
    // dead space on both sides instead of the word actually reaching
    // the screen edges. left-1/2 + w-screen + -translate-x-1/2 is the
    // real full-bleed escape: it breaks this OUTER layer out of the
    // centred container and re-centres it on the *viewport* instead,
    // regardless of how deep it sits inside that container. Safe to
    // overshoot true viewport width by a scrollbar's worth of px here —
    // globals.css already sets `overflow-x: clip` on the page as a
    // backstop for exactly this.
    //
    // TWO LAYERS, NOT ONE, is what keeps the mosaic aligned. The mosaic
    // tiles below are positioned as percentages of their own parent's
    // width, tuned to land on specific letters — that only keeps working
    // if that parent is sized to the TEXT's own width, not the
    // viewport's. So the full-bleed span belongs on this outer div
    // (flex + justify-center, no explicit width of its own), and the
    // inner div below — the one the text and the mosaic actually
    // share — stays shrink-wrapped to its content exactly like before,
    // just now centred on the screen instead of on a 1240px column.
    <div aria-hidden className="relative left-1/2 flex w-screen justify-center overflow-hidden -translate-x-1/2">
      {/* Only the CAP moved (18rem -> 28rem), not the 23vw coefficient —
          that vw term was already the right scale for "the text tracks
          the viewport at every width", including mobile, and bumping it
          instead (a mistake caught immediately after) made "on camera"
          render at ~125px on a 390px phone, badly overflowing both
          edges. The 18rem cap was only ever hit above ~1252px viewport
          width, which is exactly why it never looked wrong on mobile —
          it was tuned for back when this could never render wider than
          the 1240px content column anyway (the old -mx-* bleed only
          escaped that column's own padding, not its max-width — see the
          outer div's note), so a 288px cap already overshot a 1240px
          box. Now that the wrapper is genuinely viewport-wide, that same
          cap left real gaps on both sides at any desktop width above
          1252px; raising it to 28rem just lets the *same* 23vw curve
          keep climbing at those larger sizes instead of flattening
          early — mobile sizing is untouched since the cap doesn't
          engage there either way. */}
      <div className="relative text-[clamp(3.5rem,23vw,28rem)] select-none">
        {/* font-size lives on this wrapper, not the text itself, so the
            mosaic tiles below — siblings, not children, of the text —
            inherit the same em and stay in proportion to it as it scales. */}
        <p className="font-wordmark pointer-events-none -mb-[0.34em] text-center leading-none font-medium lowercase tracking-[-0.04em] whitespace-nowrap text-foreground/5">
          on camera
        </p>

        {/* The mosaic — see THE MOSAIC above for why these six, here. */}
        {MOSAIC.map((tile, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 bg-crimson-bright"
            style={{
              left: tile.left,
              top: tile.top,
              width: tile.size,
              height: tile.size,
              opacity: tile.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
