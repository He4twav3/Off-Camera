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
 * MONOCHROME, NOT REAL COLOUR. Eight different companies means eight
 * competing palettes, and every one of them fights the page's own single
 * accent colour — a logo bar is the one place on the page a visitor's
 * eye should register "credibility," not get pulled toward whichever
 * brand happened to ship the loudest hue. Grayscale (`grayscale` below)
 * reads as restraint here, the same discipline the rest of the page
 * already applies everywhere else in this palette (see dark-invert.css's
 * own "one flat accent, and nothing else" rule) — the marks are still
 * fully legible, just not competing with each other or with the page's
 * own red. `tone` still exists and still does the same job it always
 * did — picking a disc that lets a mark's shape actually read (a light
 * wordmark is invisible on another light disc, a dark mark disappears on
 * a dark one) — that's a lightness problem grayscale doesn't solve on
 * its own, since desaturating a colour doesn't change how light or dark
 * it already was.
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
        // own dark surface (--surface-2, a dark charcoal); "onBlack" is
        // the same case but on literal black instead, for a mark chosen
        // to sit on true black specifically.
        isTile
          ? "bg-transparent"
          : tone === "onLight"
            ? "bg-white"
            : tone === "onBlack"
              ? "bg-black"
              : "bg-surface-2"
      )}
    >
      {brand.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- local asset in /public, sized by the badge rather than a fixed layout
        <img
          src={brand.logo}
          alt={brand.name}
          className={cn(
            // grayscale first (desaturate), then a much harder contrast
            // push than a normal photo would ever want — the brief here
            // is specifically black-and-white, not "muted grayscale":
            // most of each mark's tonal range should snap to true black
            // or true white, with mid-grey surviving only where a mark
            // genuinely needs a third step to read as its own shape (the
            // parakeet's shaded feathers, GPTZero's two-tone glyph) —
            // gray as a minimal accent on top of black/white, not the
            // dominant tone the old contrast-125 produced.
            "object-contain grayscale contrast-[170%]",
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
          // The page's one accent, on the light every badge emerges from
          // and settles around — see Constellation's own note on why
          // this lives here as a prop rather than as that component's
          // hardcoded default, and BrandBadge's note on why the marks
          // themselves stay grayscale rather than getting this colour
          // individually.
          glowTint="color-mix(in oklch, var(--crimson) 42%, transparent) 0%, color-mix(in oklch, var(--crimson) 14%, transparent) 45%"
        />
      </div>

    </section>
  );
}
