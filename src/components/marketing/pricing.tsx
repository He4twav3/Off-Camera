import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { TOTAL_MODULES, TOTAL_LESSONS } from "@/lib/curriculum";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { CountdownBadge } from "@/components/marketing/countdown-badge";
import { COURSE_IS_FREE } from "@/lib/feature-flags";

const inclusions = [
  `${TOTAL_MODULES} core modules, ${TOTAL_LESSONS} lessons`,
  "Pitch & contract templates",
  "Private student community",
  "Lifetime access + future updates",
  "Campaign application checklist",
];

/**
 * The one card on the page that gets `card-featured` rather than
 * `card-premium`: a brighter top edge and a white bloom underneath, so
 * it reads as sitting closer to the light than anything around it. In a
 * palette with almost no color, "this is the important one" has to be
 * said with light, and it can only be said once — which is why nothing
 * else on the page uses that treatment.
 *
 * Back to carrying a live countdown (CountdownBadge, the same component
 * /signup uses) — removed once already for claiming free access would
 * end and a paywall would kick in, which COURSE_IS_FREE genuinely
 * doesn't back with any real clock. What's restored here is the honest
 * version, not the dishonest one it used to be: this is the *preview
 * window* countdown (a real, per-visitor 5 days from first visit — see
 * countdown-badge.tsx's own readOrStartWindow), not a claim that the
 * price is about to change. Gated on COURSE_IS_FREE for the same
 * reason the price copy below already is — when the course isn't free,
 * there's no free preview window to be counting down either, and
 * showing one next to a real price would be the exact wrong claim in
 * the other direction. Pricing is also the last section on the page
 * now (see (marketing)/page.tsx's own note on why), which is what
 * makes this genuinely the moment to show it — a countdown on a
 * mid-page section that keeps scrolling past it did less work than one
 * on the page's actual closing card.
 */
export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative mx-auto max-w-[1240px] scroll-mt-20 overflow-x-clip px-5 py-20 sm:px-6 lg:scroll-mt-32 lg:px-8"
    >
      {/* A pool of light behind the card specifically. The page's own
          atmosphere is deliberately even; this is the one place it's
          allowed to concentrate, because this is the moment the page has
          been building toward.

          The 140vw cap means this is deliberately wider than the
          viewport on narrow screens — a pool, not a disc. That bleed is
          why the section is `overflow-x-clip`: without it this span was
          the one element pushing the document's scrollWidth past the
          viewport, which is what let the whole page drift sideways.
          `clip` rather than `hidden` so the section doesn't become a
          scroll container. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/4 left-1/2 h-[40rem] w-[60rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,oklch(1_0_0_/_0.05)_0%,transparent_66%)] blur-3xl"
      />

      <SectionHeader
        index="06"
        eyebrow="What it costs"
        title="One plan. Everything included."
        lede="No tiers to think about, just the full course, once."
      />

      {/* The real, per-visitor preview-window countdown — see the header
          note above on why this is honest where the old paywall-deadline
          version wasn't, and why it's gated on COURSE_IS_FREE
          specifically. Above the card, not inside it. */}
      {COURSE_IS_FREE && (
        <Reveal delay={BEAT.body} className="mt-14">
          <CountdownBadge />
        </Reveal>
      )}

      <Reveal variant="lift" delay={BEAT.body + BEAT.step} className="mt-14">
        <div className="card-featured mx-auto max-w-md rounded-[20px] bg-surface-1 p-7 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[0.65rem] font-semibold tracking-[0.18em] text-signal uppercase">
              {siteConfig.name} · Full Course
            </span>
          </div>

          {/* Showing the real one-time price next to a button that no
              longer charges anyone would be actively misleading (see
              lib/feature-flags.ts's COURSE_IS_FREE) — swapped for "Free
              right now" instead of just hiding the price entirely, so it's
              still clear what this is normally worth. */}
          <p className="text-lit mt-5 text-[2.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-5xl">
            {COURSE_IS_FREE ? "Free" : siteConfig.price.formatted}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {COURSE_IS_FREE
              ? `Free right now. ${siteConfig.price.formatted} one-time once that changes.`
              : "One-time payment. No subscription, no upsells."}
          </p>

          <span className="rule-fade mt-7 block" aria-hidden />

          <ul className="mt-7 space-y-3.5">
            {inclusions.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-crimson/20 text-crimson-bright">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span className="text-foreground/90">{item}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="btn-cta-glass mt-9 h-auto w-full rounded-full py-4 text-base font-bold tracking-tight text-cta-foreground"
          >
            Save your spot
          </Button>
          <p className="mt-4 text-center font-mono text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
            No card required
          </p>
        </div>
      </Reveal>
    </section>
  );
}
