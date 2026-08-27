"use client";

import { BRANDS, type Brand } from "@/lib/brands";
import { SectionHeader } from "@/components/marketing/section-frame";
import { Constellation } from "@/components/marketing/constellation";
import { cn } from "@/lib/utils";

/**
 * One brand badge: a dark disc with the mark centred in it, monochrome.
 *
 * Both halves of that are load-bearing.
 *
 * THE DISC. These marks come from five different companies with five
 * different palettes, aspect ratios and background assumptions — dropped
 * straight onto the page they read as five unrelated stickers. A common
 * disc at a common size with a common edge is what makes them read as one
 * set, which is the entire point of a "brands we've worked with" section.
 * Every badge here is exactly the same size and exactly the same opacity,
 * with no depth scaling: five equal credentials, not a perspective trick.
 *
 * THE MONOCHROME. Colour here belongs to whoever owns each mark. A purple
 * logo, an orange tile and a blue wordmark next to each other are five
 * brands competing with each other and with the page's own single accent,
 * on a page whose whole palette discipline is that the only saturated
 * thing on it is the primary action. Desaturated, they become part of our
 * visual system instead of a sponsor board — and the page keeps its one
 * red thing.
 */
function BrandBadge({ brand }: { brand: Brand }) {
  const tone = brand.tone ?? "light";
  const isTile = tone === "tile";

  return (
    <div
      className={cn(
        "relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-hairline sm:size-[5.25rem]",
        "shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.12),0_16px_40px_-14px_oklch(0_0_0_/_0.95)]",
        // Every badge paints the same disc behind its mark, tiles
        // included. A tile that happens to be opaque covers it and
        // nothing changes; a tile with any transparency in it — or one
        // that is nearly black, which two of these are once desaturated —
        // then has a visible surface underneath instead of dissolving
        // into a near-black page.
        "bg-surface-2"
      )}
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local asset in /public, sized by the badge rather than a fixed layout
        <img
          src={brand.logo}
          alt={brand.name}
          className={cn(
            "object-contain",
            // Tiles fill the badge and are clipped to the circle by the
            // parent's overflow-hidden; free-standing marks are inset so
            // they have breathing room inside the disc.
            isTile ? "size-full" : "size-[58%]",
            // Desaturated, then contrast pushed back up. Removing chroma
            // from a mark that relied on hue for separation flattens it
            // toward mid-grey, and the contrast is what puts the shape
            // back — without it the marks are technically present and
            // effectively unreadable.
            "grayscale contrast-[1.35]",
            // Full brightness on both kinds of mark. Tiles used to be
            // knocked back to 0.72 to stop them out-weighing the
            // free-standing marks beside them, and since three of the
            // five brands ship a tile, that quietly dimmed most of the
            // logos on the page to level a difference nobody was
            // complaining about. Legibility of the marks beats perfect
            // evenness between them.
            isTile ? "brightness-100" : "brightness-[1.15]",
            // A dark-on-transparent mark is invisible on a near-black
            // page. `invert` flips it to light; the extra brightness
            // stops the inverted grey landing dull.
            tone === "dark" && "brightness-[1.7] invert"
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        // No real logo file. A neutral monogram, deliberately — see
        // lib/brands.ts on why an invented mark is not an option.
        <span className="font-mono text-base font-semibold tracking-[0.08em] text-foreground sm:text-lg">
          {brand.monogram}
        </span>
      )}
    </div>
  );
}

/**
 * The brand credibility section.
 *
 * The composition itself is Constellation — one mark alone at the centre,
 * expanding, releasing the others outward one at a time until they settle
 * into an even circle that then turns very slowly. See that file for the
 * choreography and for why it is a true circle rather than the tilted
 * ellipse that used to be here.
 *
 * The order of BRANDS is meaningful now in a way it wasn't: the first
 * entry is the origin — the single mark that appears alone, expands, and
 * releases the rest. It should stay the strongest one.
 *
 * Sits directly under the proof wall rather than two thirds of the way
 * down the page. Third-party validation is worth the most before a
 * visitor has decided whether to keep reading and the least after they
 * already have; running the credibility in one unbroken sequence — our
 * own videos, then the companies we made content for, then the beliefs —
 * is what makes the argument feel like it is building rather than
 * restating.
 *
 * It gets no chapter number for the same reason: the numbered chapters
 * are the argument, and this is the credential that precedes it.
 *
 * The row of company names that used to sit under the circle is gone —
 * it was the same five brands stated twice on top of each other, and the
 * marks are the point. Each badge still carries its company name as the
 * image's alt text, so the names are read out by a screen reader and
 * indexed by a crawler without being printed underneath.
 */
export function Brands({ className }: { className?: string }) {
  return (
    <section
      className={cn("relative mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8", className)}
    >
      <SectionHeader
        eyebrow="Who we've made content for"
        title="One system, then the same system again"
        lede="What worked on our own videos is what we applied for teams who needed content that actually performs."
      />

      {/* No Reveal wrapper: this composition drives itself from scroll
          position (see Constellation), and wrapping it in the page's
          fade-and-lift entrance would animate the whole thing in as one
          block before its own sequence had a chance to start — two
          entrances stacked on each other, neither reading properly. */}
      <div className="mt-8">
        <Constellation
          items={BRANDS}
          keyOf={(brand) => brand.name}
          renderItem={(brand) => <BrandBadge brand={brand} />}
        />
      </div>

    </section>
  );
}
