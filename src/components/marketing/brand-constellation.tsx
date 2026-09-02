"use client";

import { BRANDS, type Brand } from "@/lib/brands";
import { SectionHeader } from "@/components/marketing/section-frame";
import { Constellation } from "@/components/marketing/constellation";
import { cn } from "@/lib/utils";

/**
 * One brand badge: the mark centred in a disc, in its own real colour.
 *
 * Both halves of that are load-bearing.
 *
 * THE DISC. These marks come from eight different companies with eight
 * different palettes, aspect ratios and background assumptions — dropped
 * straight onto the page with no shared frame they'd read as eight
 * unrelated stickers. A common disc at a common size with a common edge
 * is what makes them read as one set, which is the entire point of a
 * "brands we've worked with" section. Every badge here is exactly the
 * same size and exactly the same opacity, with no depth scaling: eight
 * equal credentials, not a perspective trick. Its colour is the one
 * thing that isn't shared — see `tone` below.
 *
 * REAL COLOUR, NOT MONOCHROME. This used to desaturate every mark to
 * grayscale, on the theory that eight competing brand palettes would
 * fight the page's own single accent colour. In practice that read as
 * the marks being disabled or blocked, not as restraint — a logo bar
 * where every logo looks unavailable is a worse credibility signal than
 * one where they look like real, current partners. Every mark here now
 * renders in its own real colour; `tone` exists only to pick a disc that
 * lets that colour actually read (a white wordmark is invisible on
 * another white disc, a black mark disappears on a dark one), never to
 * touch the mark's own pixels — no grayscale, no invert. Inverting a
 * mark with real colour in it doesn't just flip light and dark, it
 * wrecks the colour itself (a red icon inverts to cyan), which is why
 * `tone` picks the disc instead of transforming the logo.
 */
function BrandBadge({ brand }: { brand: Brand }) {
  const tone = brand.tone ?? "onDark";
  const isTile = tone === "tile";

  return (
    <div
      className={cn(
        "relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-hairline sm:size-[5.25rem]",
        "shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.12),0_16px_40px_-14px_oklch(0_0_0_/_0.95)]",
        // Tiles bring their own background and fill the disc edge to
        // edge. Free-standing marks need an actual disc colour behind
        // them — "onLight" ones are marks that only read against a pale
        // surface (dark ink, or real colour that needs a light ground);
        // "onDark" ones are already light/white enough for this page's
        // own dark surface.
        isTile ? "bg-transparent" : tone === "onLight" ? "bg-white" : "bg-surface-2"
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
            isTile ? "size-full" : "size-[62%]"
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
