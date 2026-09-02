import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LitWords } from "@/components/marketing/lit-words";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import type { ProofPoster } from "@/lib/proof-thumbnails";

/**
 * The hero's job is one sentence long: make someone decide, in about two
 * seconds, that this is serious.
 *
 * It is the claim, the 3D ring of real proof clips (hero-carousel.tsx),
 * and the ask — all one screen, above the fold on a desktop and within
 * one short scroll on a phone. This used to run straight into a second,
 * separate carousel of the same real clips (proof-wall.tsx) with no seam
 * between them; that second one is gone now — two carousels showing the
 * same five videos was one idea built twice, and the ring here, spinning
 * continuously on the first screen, already does that job. `id="proof"`
 * stays on this section specifically so the navbar's "Proof" link and
 * this hero's own "See the proof" button still land somewhere real.
 *
 * What used to be here instead, and why none of it is:
 *
 *   - A full-width live countdown, which was the largest object on the
 *     first screen. It asked for urgency before the page had established
 *     that anything was worth being urgent about, which is the
 *     psychological order exactly backwards — nobody hurries for an
 *     offer they have not yet decided is real. It now sits directly
 *     above the price, where that question is actually being asked.
 *   - A pull-quote reading "we didn't guess, we tested it", which was
 *     verbatim the deleted proof section's own heading. Saying the
 *     page's best line twice makes it the page's best line once.
 *   - A quick-stats panel restating the four view counts as abstract
 *     numerals. Those numbers now sit on the videos they belong to. A
 *     number attached to the thing it measures is evidence; the same
 *     number floating in a panel is a claim.
 *   - A single conditional "Quick intro" YouTube embed, gated on
 *     `siteConfig.videos.intro`. That config value had been left pointing
 *     at a stock Big Buck Bunny demo id — a placeholder nobody had
 *     swapped for a real founder video — which meant the hero was
 *     actually shipping stock footage directly under copy promising "no
 *     stock footage, real results". The 3D ring below replaces the job
 *     that slot was trying to do (a video presence in the hero) with
 *     something that was never able to go stale like that: it only ever
 *     renders real proof clips pulled straight from proof-content.ts,
 *     never a hardcoded id.
 *
 * The eyebrow is the one piece of text above the headline, and it says
 * what the page is standing on rather than restating the numbers: the
 * view counts are already on the ring directly underneath, so an eyebrow
 * that quotes them spends the first line of the page saying what the
 * evidence below it says better, and says it twice.
 */
export function Hero({ posters }: { posters: ProofPoster[] }) {
  return (
    <section id="proof" className="relative isolate scroll-mt-20 overflow-hidden lg:scroll-mt-32">
      {/* Local key light — tighter and brighter than the page atmosphere,
          so the headline sits in its own pool rather than in the room's
          general light. Sized in vmin so it stays a *pool* on a phone
          instead of a wash across the whole screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-30%] left-1/2 h-[76vmin] w-[130vmin] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.09)_0%,transparent_66%)] blur-2xl"
      />

      {/* Deliberately tight vertical rhythm. The hero and the wall of
          videos underneath it are one screen, not two — every 10px this
          block spends is 10px of evidence pushed below the fold, and the
          whole reason the wall exists is that it is seen without being
          asked for. */}
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-4 text-center sm:px-6 md:pt-12 md:pb-6 lg:px-8">
        <Reveal>
          <p className="inline-flex items-center gap-3 font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-signal uppercase">
            <span className="rule-fade-bright h-px w-8 shrink-0" aria-hidden />
            Built on real results, not theory
            <span className="rule-fade-bright h-px w-8 shrink-0 rotate-180" aria-hidden />
          </p>
        </Reveal>

        {/* Tight leading + tracking: at this size, default line-height
            and letter-spacing are what make a headline read as "a big
            paragraph" rather than as a statement. (leading-[1.1], not
            tighter — text-lit's gradient is tiled per line at 1lh; a
            tighter value than the font's real descenders need is what
            clipped "to get views." before, see globals.css's own note
            on that utility.)

            font-wordmark, not font-heading: the one other place on the
            page that gets the logo's own face (Bricolage Grotesque),
            deliberately — the hero's claim is the biggest single
            statement on the page after the logo itself, and making it
            in the logo's own voice is what ties the two together. Every
            other heading stays in DM Sans; see layout.tsx's own note on
            why this and the section titles (section-frame.tsx) are the
            only two exceptions.

            The slower of LitWords' two wipe speeds, reserved for the h1 —
            see lit-words.tsx: speed comes from `as`, the h1 gets the one
            deliberate beat on the page, everything else (section titles
            included) gets the faster tier. */}
        <Reveal delay={BEAT.title}>
          <LitWords
            as="h1"
            className="text-lit font-wordmark mx-auto mt-7 max-w-3xl text-[2.7rem] leading-[1.1] font-bold tracking-[-0.022em] text-balance sm:text-6xl md:text-[4.5rem] lg:text-[5rem]"
          >
            You don&apos;t need a following to get views.
          </LitWords>
        </Reveal>

        <Reveal delay={BEAT.lede}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-[1.0625rem] lg:text-lg">
            You need content people want to watch. We made these with{" "}
            <strong className="font-semibold text-foreground">no following</strong>,{" "}
            <strong className="font-semibold text-foreground">no experience</strong>, and{" "}
            <strong className="font-semibold text-foreground">no expensive gear</strong>.
          </p>
        </Reveal>
      </div>

      {/* The 3D ring — real proof clips, evenly spaced around a true
          perspective cylinder that does its own foreshortening (see
          hero-carousel.tsx). The CTA cluster below is passed in as
          children and rendered centred *over* the ring, front and
          centre the way it would be if it were printed on the middle
          card, not stacked in the page flow above or below it. */}
      <Reveal delay={BEAT.body} variant="fade">
        <HeroCarousel posters={posters} className="mt-12 md:mt-14">
          {/* One dominant CTA, one quiet second one — not two competing
              equally-weighted buttons. The crimson fill stays this
              cluster's only genuinely colored element; the second button
              is a plain outline that reads as "or, if you'd rather look
              first" rather than a second ask. It points at the evidence
              directly under this section, not at another sales step —
              the honest answer to "why should I believe that headline"
              is one scroll away, not a new page. */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* The one genuinely colored element above the fold. On a
                page that is otherwise entirely graphite and light, a
                deep crimson fill is unmissable at any size — which is
                why it can be the only red thing here and still
                dominate. The whole treatment lives in btn-cta — see
                globals.css. */}
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/signup" />}
              className="btn-cta h-auto rounded-full px-10 py-4 text-base font-bold tracking-tight text-cta-foreground sm:px-12 sm:py-5 sm:text-lg"
            >
              Save my free spot
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="#proof" />}
              // Inline style, not bg-surface-2: the "outline" variant's
              // own bg-background utility sets the same CSS property,
              // and which of two same-specificity classes wins is down
              // to Tailwind's internal generation order, not the order
              // they're written here — btn-cta hit the exact same
              // conflict against the base Button's bg-primary and
              // needed !important to reliably win for the same reason.
              // An inline style always wins that cascade outright.
              style={{ backgroundColor: "var(--surface-2)" }}
              className="h-auto rounded-full border-transparent px-8 py-4 text-base font-semibold text-foreground hover:brightness-110 sm:px-9 sm:py-5 sm:text-lg"
            >
              See the proof
            </Button>
          </div>

          <p className="text-premium-sm font-mono text-[0.7rem] tracking-[0.12em] text-signal uppercase">
            Free for 5 days · No card required · €0 on gear to start
          </p>

          {/* The trust-line. Never a number we don't have — no "trusted
              by N businesses" here, because we can't back that number
              the way every view count on this page is backed by a real,
              clickable post (PRODUCT_VISION.md §17: never invent a
              stat). This is what an honest version of that line looks
              like: a promise about what the reader is about to find,
              not a headcount. */}
          <p className="text-premium-sm text-xs text-muted-foreground/80">
            Every number below is real — click through and watch it yourself.
          </p>
        </HeroCarousel>
      </Reveal>
    </section>
  );
}
