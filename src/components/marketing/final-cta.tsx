import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import { siteConfig } from "@/lib/site-config";

/**
 * The close.
 *
 * Was a bordered card with a drifting icon field behind it. The icon
 * field is gone: a marquee of little camera glyphs is decoration, and
 * decoration at the moment of the ask is the one place it actively
 * costs something. What's behind the type now is light — a wide pool
 * rising from below the CTA, so the last thing on the page reads as the
 * brightest point of the whole scroll rather than as one more card.
 *
 * No card at all, in fact. Every other section on this page is contained;
 * this one opens out, which is what makes it register as the end of the
 * argument rather than as another item in the list.
 *
 * DELIBERATELY THIN NOW, NOT A SECOND PITCH. Sits right after Pricing and
 * FAQ — the plan, the price, the objections, all already made their case
 * a few hundred pixels up — so this used to restate the offer's own
 * fine-print terms directly underneath FAQ, one section after a visitor
 * had already seen the same terms twice (Pricing, and the hero before that).
 * The fine print is gone; what's left is one line and the button — a
 * closing beat, not a re-pitch. Ending the page on FAQ itself instead
 * (cutting this section entirely) was the other option, but a page that
 * closes on the last unresolved objection instead of a confident final
 * ask is the weaker ending, so this stays — just short now, on purpose.
 */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
        {/* card-featured, the treatment otherwise reserved for the pricing
            card: a brighter top edge and a white bloom underneath, so this
            surface reads as sitting closest to the light. Two things on
            one page may carry it — the plan you are being asked to buy and
            the ask itself — and nothing else. */}
        <div className="card-featured relative overflow-hidden rounded-[20px] bg-surface-1 px-6 py-14 text-center sm:px-12 sm:py-16">
          {/* The page's final light source, rising from behind the button
              and contained by the panel rather than bleeding across the
              whole viewport. */}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 h-[26rem] w-[46rem] max-w-[150%] -translate-x-1/2 translate-y-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.1)_0%,transparent_64%)] blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl">
        <Reveal>
              <SectionEyebrow label="Start now" />
            </Reveal>
            <Reveal delay={BEAT.title}>
              <h2 className="text-lit mt-6 text-3xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
                Different formats.{" "}
                <span className="text-beam">Same underlying formula.</span>
              </h2>
            </Reveal>
            <Reveal delay={BEAT.body} className="mt-9 flex justify-center">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={siteConfig.communityUrl ?? "/signup"} target="_blank" rel="noopener noreferrer" />}
                className="btn-cta-glass group/cta h-auto rounded-full px-11 py-5 text-lg font-bold tracking-tight text-cta-foreground"
              >
                Join free on Discord
                <ArrowRight className="ml-1 size-4 transition-transform duration-300 ease-[var(--ease-cinematic)] group-hover/cta:translate-x-1" />
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
