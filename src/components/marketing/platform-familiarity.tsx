"use client";

import { PLATFORMS, type Platform } from "@/lib/platforms";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { LitWords } from "@/components/marketing/lit-words";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

/**
 * "You already know these apps." A second, separate credibility beat from
 * Brands (companies On Camera made content for) — this one isn't
 * third-party validation, it's familiarity: the training happens on the
 * apps a visitor already has open, not a new tool to learn first.
 *
 * TWO ROWS, OPPOSITE DIRECTIONS. Replaced an earlier version of this
 * section (a single Constellation ring, borrowed from Brands' own
 * choreography) with the layout actually asked for: a top row drifting
 * right, a bottom row drifting left — the same convention symbol-field.tsx
 * already uses for its own two-direction marquee rows, just with real
 * platform marks instead of decorative glyphs. Each row is the existing
 * `animate-marquee` CSS keyframe (globals.css) — compositor-only,
 * transform-only, the same primitive the proof carousel's own reel
 * doesn't use anymore for exactly the jank reasons documented there, but
 * a plain two-direction icon wall never had that problem in the first
 * place: nothing here needs a curve or a depth cue, just steady opposite
 * drift.
 *
 * No claim of partnership or endorsement by any platform named here —
 * these are the apps creators publish to, not sponsors (PRODUCT_VISION.md
 * §17: never imply validation that wasn't actually given).
 */
/** Every mark at the exact same size, on the exact same disc, centred by
 * plain flexbox — no per-platform exception any more. A previous version
 * gave Instagram/Snapchat a full-bleed "tile" treatment (their own
 * colour filling the whole circle) while TikTok/YouTube/Threads sat
 * inset on a neutral disc — two different visual rules on five things
 * meant to read as one consistent row, which is what actually produced
 * the "inconsistently sized/inset" complaint. Every icon's own SVG now
 * carries its real colour directly (platform-icons.tsx), so the badge's
 * only job is one shared disc and one shared inset. */
function PlatformBadge({ platform }: { platform: Platform }) {
  const Icon = platform.icon;
  return (
    <div
      className="relative flex size-14 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.12),0_16px_40px_-14px_oklch(0_0_0_/_0.95)] sm:size-16"
      aria-label={platform.name}
    >
      <Icon className="size-[52%]" />
    </div>
  );
}

/** One drifting row. Content is duplicated once so translating exactly
 * -50% loops seamlessly — see symbol-field.tsx's MarqueeRow, the same
 * convention. `reverse` flips both the visual direction (via
 * `animation-direction: reverse`, so it drifts right instead of left)
 * and the row's own edge — content that started off the right edge for
 * a left-drifting row needs to start off the left edge to drift right,
 * or the loop point is visible as a jump instead of a seam. */
function PlatformRow({ reverse }: { reverse?: boolean }) {
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <div
      className={cn(
        "animate-marquee flex w-max shrink-0 items-center gap-6 [animation-duration:34s] motion-reduce:animate-none sm:gap-8",
        reverse && "[animation-direction:reverse]"
      )}
    >
      {items.map((platform, i) => (
        <PlatformBadge key={`${platform.name}-${i}`} platform={platform} />
      ))}
    </div>
  );
}

export function PlatformFamiliarity({ className }: { className?: string }) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <SectionEyebrow label="Built for where you already post" />
          </Reveal>
          <Reveal delay={BEAT.title}>
            <LitWords
              as="h2"
              className="text-lit font-wordmark mt-5 text-3xl leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[2.6rem]"
            >
              Made for the apps you&apos;re already using
            </LitWords>
          </Reveal>
          <Reveal delay={BEAT.lede}>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty">
              The training is built around the platforms creators actually
              publish to — no new app to learn, no new habit to build.
            </p>
          </Reveal>
        </div>

        {/* Full-bleed relative to this section's own max-width, edges
            faded to transparent rather than hard-cropped — a wall of
            recognisable app icons benefits from looking like it
            continues past the visible edge, unlike the proof carousel's
            curved cards which are meant to be seen edge-on. */}
        <div
          className={cn(
            "mt-10 flex flex-col gap-5 overflow-hidden sm:mt-12 sm:gap-6",
            "[mask-image:linear-gradient(90deg,transparent_0%,black_8%,black_92%,transparent_100%)]",
            "[-webkit-mask-image:linear-gradient(90deg,transparent_0%,black_8%,black_92%,transparent_100%)]"
          )}
        >
          <PlatformRow reverse />
          <PlatformRow />
        </div>
      </div>
    </section>
  );
}
