import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LitWords } from "@/components/marketing/lit-words";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import type { ProofPoster } from "@/lib/proof-thumbnails";

/**
 * The hero's job is one sentence long: make someone decide, in about two
 * seconds, that this is serious.
 *
 * It is the claim, an intro-video slot, the ask, and the 3D ring of real
 * proof clips (hero-carousel.tsx) — all one screen, above the fold on a
 * desktop and within one short scroll on a phone. This used to run
 * straight into a second, separate carousel of the same real clips
 * (proof-wall.tsx) with no seam between them; that second one is gone —
 * two carousels showing the same videos was one idea built twice, and
 * the ring here already does that job. It doesn't spin on its own: it
 * sits still — with real view counts on every card — until someone
 * actually grabs and drags or trackpad-swipes it. `id="proof"` stays on
 * this section specifically so the navbar's "Proof" link still lands
 * somewhere real.
 *
 * Two other things that used to be here, and why they aren't:
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
 *
 * TOP TO BOTTOM, ON PURPOSE: claim → intro-video slot → trust line →
 * button → ring. The video and the ask sit ABOVE the ring now, not
 * floating on top of it — they used to be centred over the ring itself
 * (passed into HeroCarousel as overlay children), which put the page's
 * one real CTA on top of a moving, draggable surface and made its
 * caption text legible only by scrimming it against whatever card
 * happened to be spinning underneath. Stacking them in normal flow
 * instead means the button and captions sit on the section's own plain
 * background, not on a rotating video — legible by construction, no
 * scrim needed — and the ring, no longer asked to host anything, goes
 * back to being exactly what it's for: real proof, drag to explore.
 *
 * THE INTRO-VIDEO SLOT IS AN EMPTY PLACEHOLDER, DELIBERATELY. This spot
 * used to hold a "Quick intro" YouTube embed, gated on
 * `siteConfig.videos.intro` — and that config value had been left
 * pointing at a stock Big Buck Bunny demo id nobody had ever swapped for
 * a real founder video, so the hero was quietly shipping stock footage
 * directly under copy promising "no stock footage, real results". That
 * slot got deleted rather than fixed at the time. This is the same slot
 * back, but built the opposite way round: an honestly-empty frame (no
 * `<video>`, no embed, no id to go stale) that renders as a placeholder
 * until a real clip is dropped in, rather than a real-looking player
 * quietly holding a fake video. The 3D ring below still carries every
 * bit of the actual evidence in the meantime — this slot adds nothing
 * false, it just reserves the room for something true later.
 *
 * The eyebrow is the one piece of text above the headline, and it says
 * what the page is standing on rather than restating the numbers: the
 * view counts are already on the ring further down, so an eyebrow that
 * quotes them spends the first line of the page saying what the evidence
 * below it says better, and says it twice.
 */
export function Hero({ posters }: { posters: ProofPoster[] }) {
  return (
    <section
      id="proof"
      // overflow-x only, not overflow-hidden — the x-clip is still needed
      // for the local key light below (w-[130vmin] genuinely runs past
      // the viewport edge on purpose), and a plain overflow-hidden would
      // also clip vertically. The ring itself no longer needs that
      // vertical room from an ancestor to begin with — its own stage is
      // now sized to fully contain its magnified front card (see
      // hero-carousel.tsx's STAGE_HEIGHT_RATIO) rather than relying on
      // this section not clipping it.
      className="relative isolate scroll-mt-20 overflow-x-hidden lg:scroll-mt-32"
    >
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

            The slower of LitWords' two curtain-wipe speeds lands here —
            see lit-words.tsx on why `as="h1"` is what picks that, not a
            prop threaded through from here. */}
        <Reveal delay={BEAT.title}>
          <LitWords
            as="h1"
            className="text-lit font-wordmark mx-auto mt-7 max-w-3xl text-[2.7rem] leading-[1.1] font-bold tracking-[-0.022em] text-balance sm:text-6xl md:text-[4.5rem] lg:text-[5rem]"
          >
            Learn the craft. Build the career.
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

        {/* The intro-video placeholder — see the header note on why this
            is deliberately empty (no `<video>`, no embed) rather than
            wired to any real source yet. aspect-video + object-position
            centred content, same rounded-[22px]/border-hairline/gradient
            vocabulary CarouselCard's own no-thumbnail fallback tile uses
            (hero-carousel.tsx), so an empty video slot and an empty
            proof card read as the same kind of "nothing here yet" rather
            than two different placeholder languages. */}
        <Reveal delay={BEAT.body} variant="lift">
          <div className="relative mx-auto mt-9 aspect-video w-full max-w-xl overflow-hidden rounded-[22px] border border-hairline bg-gradient-to-b from-surface-3 to-surface-1 shadow-[0_20px_40px_-8px_oklch(0_0_0_/_0.4)]">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span
                aria-hidden
                className="flex size-14 items-center justify-center rounded-full bg-foreground/10 sm:size-16"
              >
                <Play className="size-6 fill-current text-foreground/70 sm:size-7" strokeWidth={1.5} />
              </span>
              <span className="font-mono text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">
                Intro video — coming soon
              </span>
            </div>
          </div>
        </Reveal>

        {/* The trust-line pair. Plain flow now, on the section's own
            dark background — not floating over the ring's own rotating
            cards the way this used to (see header note), so there's no
            scrim to fight a busy backdrop with; the page's ordinary text
            colours are legible here by construction. Never a number we
            don't have — no "trusted by N businesses" here, because we
            can't back that number the way every view count on this page
            is backed by a real, clickable post (PRODUCT_VISION.md §17:
            never invent a stat). The second line is what an honest
            version of that claim looks like instead: a promise about
            what the reader is about to find, not a headcount. */}
        <Reveal delay={BEAT.body + BEAT.step}>
          <div className="mt-7 flex flex-col items-center gap-2">
            <p className="font-mono text-[0.7rem] tracking-[0.12em] text-signal uppercase">
              No card required · €0 on gear to start
            </p>
            <p className="text-xs text-muted-foreground">
              Every number below is real — click through and watch it yourself.
            </p>
          </div>
        </Reveal>

        {/* The one dominant CTA. This used to sit beside a quiet outline
            second button ("See the proof", linking to this same
            section's own id="proof"), removed because it pointed at
            content it was floating directly on top of at the time.

            btn-cta-glass — translucent crimson over a backdrop blur
            instead of a solid fill, still unmissable at any size
            against the otherwise graphite-and-light page. Every other
            "Save your spot" CTA on the site (navbar, pricing, final CTA)
            uses this same treatment now too, not just this one: one
            action, one physical treatment, everywhere it appears — see
            that utility's own header note in globals.css. */}
        <Reveal delay={BEAT.body + BEAT.step * 2}>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="btn-cta-glass mt-7 h-auto rounded-full px-10 py-4 text-base font-bold tracking-tight text-cta-foreground sm:px-12 sm:py-5 sm:text-lg"
          >
            Save my free spot
          </Button>
        </Reveal>
      </div>

      {/* A one-line intro for the ring, since nothing else on the page
          names it before it just appears — the eyebrow at the very top
          set up the claim, not this. Reuses SectionEyebrow (same
          hairline + tracked label every other section's header opens
          with) rather than inventing a one-off caption style for it. */}
      <Reveal delay={BEAT.body + BEAT.step * 3}>
        <SectionEyebrow label="Real videos we've posted — drag to spin" className="mt-12 md:mt-14" />
      </Reveal>

      {/* The 3D ring — real proof clips, evenly spaced around a true
          perspective cylinder that does its own foreshortening (see
          hero-carousel.tsx). No longer hosting the CTA cluster as
          overlay children (see header note): it just spins, real proof,
          drag to explore. */}
      <Reveal delay={BEAT.body + BEAT.step * 4} variant="fade">
        <HeroCarousel posters={posters} className="mt-5" />
      </Reveal>
    </section>
  );
}
