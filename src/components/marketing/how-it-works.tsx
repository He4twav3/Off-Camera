import { GraduationCap, Clapperboard, Trophy } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { stagger, BEAT } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { SpotlightCard } from "@/components/marketing/spotlight-card";
import { TOTAL_MODULES } from "@/lib/curriculum";

/**
 * What actually happens if you join — stated once, explicitly, as a
 * track you travel along.
 *
 * The page's argument has always had this shape (problem → belief →
 * proof → system → training → opportunity, see PRODUCT_VISION.md §13),
 * but it was only ever expressed as section *order*. That works on
 * someone who reads the whole page top to bottom and does nothing at all
 * for the much larger group who skim it in fifteen seconds: section order
 * is invisible unless you actually travel through it. This is the same
 * journey said out loud, early enough that a fast reader gets the whole
 * shape of the offer before deciding whether to slow down.
 *
 * WHY IT LOOKS LIKE A TRACK. This and the section above it used to be the
 * same component twice — three cards, three columns, identical stagger —
 * which is why the pair read as repetition rather than as two arguments.
 * The claims above are now a stack being struck out one at a time; this
 * is the thing that stack is not: an ordered route with a beginning and
 * an end, drawn as one.
 *
 * The rail is what carries it, and it runs left to right at every width
 * — including on a phone. Three separate cards appearing is a grid; one
 * line running the length of an ordered route is a process. It hangs off
 * the shared Reveal's `data-revealed` hook rather than opening its own
 * observer, so the whole thing runs on the page's one rhythm.
 *
 * THE PHONE KEEPS THE DESKTOP LAYOUT, it does not fall back to a list.
 * This used to collapse below `md` into a vertical stack with the rail
 * turned on its side, which is the obvious responsive move and it threw
 * away the thing that made the section work: a route reads as a route
 * because it goes *across*. Turned vertical it is just three paragraphs
 * with a line next to them, indistinguishable from every other stacked
 * section on the page.
 *
 * So on a phone the track stays horizontal and becomes swipeable. The
 * rail still runs the full length of it, the numerals still sit on the
 * rail in order, the cards are still cards — you just travel the route
 * with a thumb instead of taking it in at a glance. Same style, same
 * reading, adapted to the width rather than replaced because of it.
 *
 * WHAT IT DELIBERATELY IS NOT. The first version put an expanding ring
 * around each numeral and took 1.4 seconds to draw the rail. Both looked
 * cheap for the same reason: a ring blooming out of a number is a
 * generic template flourish, and a line that takes a second and a half
 * to cross the screen reads as the page being slow rather than as
 * anything being revealed. The rail now draws in 500ms — the ceiling the
 * whole page holds to — and the numerals simply go from muted to lit as
 * their step lands, which is the same "light means arrived" language
 * every other surface on this page already speaks.
 *
 * Step three is written carefully. PRODUCT_VISION.md §17 rules out
 * promising a brand deal, a campaign, or income — the opportunity is real
 * but always conditional on demonstrated ability and on actual brand
 * demand at the time. So the copy says "can", names the condition, and
 * names what it is conditional on. That is the difference between a
 * promise we would have to keep and a door we can honestly say exists.
 */
const steps = [
  {
    icon: GraduationCap,
    title: "Learn the system",
    body: `${TOTAL_MODULES} modules on the mechanics behind content that performs — hooks, retention, volume, consistency, timing, iteration. Not a tour of one format.`,
  },
  {
    icon: Clapperboard,
    title: "Make your own content",
    body: "Every module ends in something you actually do. You finish with posted videos and the ability to read what their numbers are telling you.",
  },
  {
    icon: Trophy,
    title: "Show what you can do",
    body: "Creators who prove they can produce content that performs can be introduced to real brand opportunities through our network. Earned on demonstrated ability, never handed out for finishing.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-[1240px] px-5 py-20 sm:px-6 lg:px-8">
      <SectionHeader
        index="03"
        eyebrow="How this works"
        title="Learn it, make it, prove it"
        lede="Three steps, in order. The first one is free for five days."
      />

      <div className="relative mt-16">
        {/* The scroller. Below `md` this is a snap track the thumb
            swipes along; from `md` up the overflow and the fixed widths
            switch off and it is a plain three-column grid again.

            -mx-4 + px-4 lets the row bleed to both screen edges inside a
            padded section, so the next step is cut off by the edge of the
            screen rather than by a margin — that sliver is the entire
            "the route continues" affordance.

            touch-pan-x locks a drag started here to the horizontal axis,
            so a swipe along the track can't wander into a vertical page
            scroll halfway through. */}
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0 md:pb-0 lg:mx-0">
          <ol className="relative flex w-max touch-pan-x snap-x snap-mandatory gap-4 md:grid md:w-auto md:grid-cols-3 md:gap-8">
            {/* THE RAIL. Absolutely positioned inside the track, so on a
                phone it spans the full scrollable width rather than just
                the visible viewport — the line genuinely runs the length
                of the route and scrolls with it.

                variant="fade" on the wrapper: the rail must not also
                slide, or the line appears to be drawn by something that
                is itself moving. It fades in place and the scale does the
                rest. */}
            <Reveal
              variant="fade"
              delay={BEAT.body}
              className="pointer-events-none absolute top-[1.4rem] right-8 left-8 z-0"
            >
              <span
                aria-hidden
                className={[
                  "block h-px origin-left",
                  "bg-gradient-to-r from-crimson-bright/60 via-crimson/30 to-transparent",
                  "scale-x-0 transition-transform duration-500 ease-[var(--ease-cinematic)]",
                  "group-data-[revealed=true]/reveal:scale-x-100",
                  "motion-reduce:scale-x-100 motion-reduce:transition-none",
                ].join(" ")}
              />
            </Reveal>

            {steps.map((step, i) => (
            <Reveal key={step.title} variant="lift" delay={stagger(i)}>
              <SpotlightCard
                as="li"
                size={380}
                // Identical composition at every width — numeral on the
                // rail, then icon + title, then body. It used to switch to
                // a horizontal icon-beside-text row below `md`, which is
                // what made the phone version read as a different
                // component rather than the same one at a smaller size.
                className="flex h-full w-[78vw] max-w-[19rem] shrink-0 snap-start flex-col rounded-[12px] md:w-auto md:max-w-none"
              >
                {/* THE NODE. Sits on the rail, so it needs an opaque
                    background — the line runs underneath it and would
                    otherwise show straight through the numeral.

                    The ring is the part that animates: it expands out of
                    the plate and settles as the step lands, which is what
                    makes the rail read as having *reached* this point
                    rather than the plate having simply appeared on top of
                    a line that was already there. */}
                {/* THE NODE. Sits on the rail, so it needs an opaque
                    background — the line runs underneath it and would
                    otherwise show straight through the numeral.

                    It arrives muted and lights as its step lands. No
                    ring, no bloom: on a page whose entire hierarchy
                    mechanism is light, "this one is now lit" is already
                    the vocabulary, and adding a second, louder signal for
                    the same event is what made it look like a template. */}
                <span
                  className={[
                    "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold tabular-nums",
                    "bg-gradient-to-b from-surface-3 to-surface-2 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.09),0_10px_24px_-14px_oklch(0_0_0_/_0.9)]",
                    "border-hairline text-muted-foreground",
                    "transition-[color,border-color] duration-300 ease-[var(--ease-cinematic)]",
                    "group-data-[revealed=true]/reveal:border-hairline-strong group-data-[revealed=true]/reveal:text-foreground",
                    "motion-reduce:transition-none",
                  ].join(" ")}
                  style={{ transitionDelay: "200ms" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="mt-7 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <step.icon className="size-4 shrink-0 text-signal" strokeWidth={1.75} />
                    <h3 className="text-lg leading-snug font-semibold text-balance text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </SpotlightCard>
            </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
