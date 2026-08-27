import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LitWords } from "@/components/marketing/lit-words";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";
import { siteConfig } from "@/lib/site-config";

/**
 * The hero's job is one sentence long: make someone decide, in about two
 * seconds, that this is serious.
 *
 * It is deliberately only the claim and the ask — the evidence for it is
 * the panoramic proof wall directly underneath (proof-wall.tsx), which
 * this section runs straight into with no seam between them. They read
 * as one screen: the sentence, the button, and the videos it is talking
 * about, all above the fold on a desktop and within one short scroll on
 * a phone.
 *
 * What used to be here instead, and why none of it is:
 *
 *   - A full-width live countdown, which was the largest object on the
 *     first screen. It asked for urgency before the page had established
 *     that anything was worth being urgent about, which is the
 *     psychological order exactly backwards — nobody hurries for an
 *     offer they have not yet decided is real. It now sits directly
 *     above the price, where that question is actually being asked.
 *   - A pull-quote reading "we didn't guess, we tested it", which is
 *     verbatim the heading of the proof section. Saying the page's best
 *     line twice makes it the page's best line once.
 *   - A quick-stats panel restating the four view counts as abstract
 *     numerals. Those numbers now sit on the videos they belong to. A
 *     number attached to the thing it measures is evidence; the same
 *     number floating in a panel is a claim.
 *
 * The eyebrow is the one piece of text above the headline, and it says
 * what the page is standing on rather than restating the numbers: the
 * view counts are already on the wall directly underneath, so an eyebrow
 * that quotes them spends the first line of the page saying what the
 * evidence below it says better, and says it twice.
 *
 * The intro video, above the button, is conditional on siteConfig.
 * videos.intro the exact way story.tsx's is on videos.story — same
 * reasoning: a reserved box with no real video in it doesn't read as
 * "a video is coming", it reads as something broken, so there is no
 * video here at all until a real one exists. Set videos.intro and this
 * appears with no other change; leave it unset and the button just sits
 * one Reveal beat closer to the lede, which is exactly the layout that
 * shipped before this slot existed. It's deliberately small and
 * portrait, not the width of the column — this is the one part of the
 * hero's "every 10px pushed below the fold" argument that a video
 * genuinely earns an exception from, so it earns as little of it as a
 * real preview still can.
 */
export function Hero() {
  const introVideo = siteConfig.videos.intro;

  return (
    <section className="relative isolate overflow-hidden">
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
          asked for. Padding, type scale and the gaps between the five
          elements here were all pulled in for that one reason. */}
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-8 text-center sm:px-6 md:pt-12 md:pb-10 lg:px-8">
        <Reveal>
          <p className="inline-flex items-center gap-3 font-mono text-[0.7rem] font-semibold tracking-[0.16em] text-signal uppercase">
            <span className="rule-fade-bright h-px w-8 shrink-0" aria-hidden />
            Built on real results, not theory
            <span className="rule-fade-bright h-px w-8 shrink-0 rotate-180" aria-hidden />
          </p>
        </Reveal>

        {/* leading-[0.95] + -0.035em tracking: at this size, default
            line-height and letter-spacing are what make a headline read
            as "a big paragraph" rather than as a statement.

            Letter-by-letter here and nowhere else on the page — see
            lit-words.tsx on why that grain is reserved for the h1. The
            step is deliberately short (26ms): at the per-word tempo the
            section headings use, a headline this long would take well
            over a second to finish lighting. */}
        <Reveal delay={BEAT.title}>
          <LitWords
            as="h1"
            unit="char"
            step={26}
            className="text-lit mx-auto mt-7 max-w-3xl text-[2.7rem] leading-[0.95] font-semibold tracking-[-0.022em] text-balance sm:text-6xl md:text-[4.5rem] lg:text-[5rem]"
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

        {/* See the header note on why this is conditional rather than a
            reserved box — no siteConfig.videos.intro, no video, no gap
            left behind either: the button above just moves up to fill
            the space, same as it did before this slot existed. */}
        {introVideo && (
          <Reveal delay={BEAT.body} variant="fade" className="mt-7 flex justify-center">
            {/* Horizontal, not portrait — this is a talking-head/screen
                intro, not another tile off the proof wall, and it reads
                as a real video preview at this ratio instead of a tall
                sliver. Sized in three real steps rather than one narrow
                box that just gets a bit wider: max-w-xs on a phone is
                already most of the column's width without crowding the
                button under it; sm bumps it up for a bigger phone/small
                tablet; lg matches the lede paragraph's own max-w-xl so
                the video lines up with the text column above it instead
                of looking like a separate, arbitrarily-sized object once
                there's real desktop width to work with. */}
            <VideoPlayer
              aspect="video"
              frame="premium"
              label="Quick intro"
              youtubeId={introVideo}
              className="w-full max-w-xs sm:max-w-sm lg:max-w-xl"
              poster={
                <VideoPoster variant="muted">
                  <span className="font-mono text-2xl font-semibold tracking-[0.1em]">AR</span>
                </VideoPoster>
              }
            />
          </Reveal>
        )}

        {/* Single CTA, deliberately: we're gathering the free-preview list
            first, not pushing checkout, so this button shouldn't have to
            compete with an equally-weighted "Enroll now" for attention.
            Enrollment still exists — Pricing and the closing CTA keep
            their own — this is just the hero's one job right now.

            The one genuinely colored element above the fold. On a page
            that is otherwise entirely graphite and light, a deep crimson
            fill is unmissable at any size — which is why it can be the
            only red thing here and still dominate. The whole treatment
            lives in btn-cta — see globals.css. */}
        <Reveal
          delay={introVideo ? BEAT.body + BEAT.step : BEAT.body}
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="btn-cta h-auto rounded-full px-10 py-4 text-base font-bold tracking-tight text-cta-foreground sm:px-12 sm:py-5 sm:text-lg"
          >
            Save my free spot
          </Button>
        </Reveal>

        <Reveal delay={BEAT.body + BEAT.step * (introVideo ? 2 : 1)}>
          <p className="mt-4 font-mono text-[0.7rem] tracking-[0.12em] text-signal uppercase">
            Free for 5 days · No card required · €0 on gear to start
          </p>
        </Reveal>
      </div>
    </section>
  );
}
