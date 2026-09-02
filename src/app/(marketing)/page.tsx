import { Hero } from "@/components/marketing/hero";
import { getProofPosters } from "@/lib/proof-thumbnails";
import { Brands } from "@/components/marketing/brand-constellation";
import { WhoItsFor } from "@/components/marketing/who-its-for";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CourseIntro } from "@/components/marketing/course-intro";
import { FullCurriculum } from "@/components/marketing/full-curriculum";
import { Outcomes } from "@/components/marketing/outcomes";
import { Story } from "@/components/marketing/story";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { ViewfinderFrame } from "@/components/site/viewfinder-frame";
import { SectionSeam } from "@/components/marketing/section-frame";

/**
 * One landing page, built as one continuous argument.
 *
 * The order below is the argument's order, and each move in it answers a
 * question the previous one raises. Read as a sequence of questions a
 * stranger is actually asking:
 *
 *   HERO         "What is this, and is it real?"          claim + the
 *                3D ring of real videos, with their actual view counts,
 *                on the first screen
 *   BRANDS       "Has anyone else trusted them?"          third-party
 *                validation, while it is still worth something — before
 *                the reader has decided whether to keep going, not two
 *                thirds of the way down once they already have
 *   01 BELIEFS   "Yes, but I have no following / no
 *                experience / my videos don't work."      the reasons
 *                people talk themselves out of starting, named before
 *                anything tries to answer them
 *   02 PROCESS   "Okay — so what actually happens if I
 *                join?"                                   the three
 *                steps, stated explicitly for the majority who skim
 *   03 PLAIN     "Is any of this something I could
 *                actually do?"                           the eight
 *                things that decide whether a video works, named the way
 *                someone who has never posted would name them rather
 *                than in the industry's words — the beat where "they did
 *                this" turns into "I could do this too"
 *   04 COURSE    "What's in it?"                          the product,
 *                its real numbers, and every module with what you make
 *                in it and the lessons inside it
 *   05 STORY     "Who is teaching this?"
 *   06 FAQ       "The last few things stopping me."       objections,
 *                answered before the final ask, not after it
 *   07 PRICING   "Okay — so what does it cost, and how do
 *                I actually start?"                       the price and
 *                the button, now doubling as the page's own close: the
 *                last thing on the page is the offer itself, not a
 *                second, separate card restating the same ask a few
 *                hundred pixels later. A dedicated FinalCTA section used
 *                to sit here instead, its own card with its own copy and
 *                its own "Save your spot" — genuinely repetitive once it
 *                followed Pricing this closely (same button, same fine
 *                print, one section apart), and a page that closed on an
 *                unresolved FAQ instead wasn't the fix either. Moving
 *                Pricing itself to close the page (past FAQ, not before
 *                it) is: the price is what FAQ's objections were about
 *                in the first place, so answering them and then landing
 *                immediately on the thing they were objections *to* is a
 *                tighter close than a generic restatement of it would
 *                have been.
 *
 * The evidence used to get its own numbered chapter (02 PROOF) below the
 * beliefs — a second, flat carousel of the same real clips, separate
 * from the hero's own ring. Removed: two carousels of the same videos
 * was one idea built twice, and the hero's ring — draggable/spinnable,
 * always in view on the first screen — already does that job better
 * than a component someone had to scroll to reach. Every chapter after
 * it renumbered down by one to close the gap.
 *
 * Two sections that used to be here are gone, both for the same reason —
 * they answered a question nobody was asking at that point:
 *
 *   - The quick-stats panel restated the four view counts as abstract
 *     numerals below the fold. Those numbers now sit on the videos they
 *     belong to, in the hero. A number attached to the thing it measures
 *     is evidence; the same number floating in a panel is a claim.
 *   - The marketplace card showed the course "as it would look on Whop".
 *     It made a visitor understand nothing they needed, and it displayed
 *     the €17.99 price a few hundred pixels above the pricing section
 *     saying the course is currently free — actively contradicting the
 *     offer at the moment of the ask.
 */
export default async function Home() {
  // Resolved once on the server and cached (lib/proof-thumbnails.ts), not
  // per-card in the browser: these posters are the first thing on the
  // page, and the wall cannot be empty for the first second of a visit.
  const posters = await getProofPosters();

  return (
    <>
      {/* Landing-page-only, not sitewide: the "this site is about making
          content" framing device belongs to the pitch, not to
          /dashboard or /checkout, which have their own calmer, more
          transactional tone. */}
      <ViewfinderFrame />

      {/* Every section below animates its own individual headings,
          paragraphs, cards, icons, and other pieces on scroll (each wraps
          its own content in Reveal directly) — no outer Reveal here, that
          would just double up the motion on top of the per-element
          stagger every section already does internally.

          The SectionSeam between blocks is the page's punctuation: a
          hairline that fades to nothing at both ends with a soft bloom
          on it, so one section ends and the next begins rather than the
          two running together. It is omitted wherever it would land
          immediately against a section's own contained card edge, where
          it reads as a stray line rather than as a boundary — which is
          why the hero, ending in the reel's own controls, is the only
          block that opens straight into one. */}
      {/* The hero's own 3D ring carousel (hero-carousel.tsx) is the
          proof wall now — a separate, second carousel of the same real
          clips directly underneath it was two things doing one job, so
          that older section (proof-wall.tsx, a flat drag-panned wall) is
          gone. Its drag-panned spin and per-card view counts live on
          though, ported onto the ring itself. */}
      <Hero posters={posters} />
      <SectionSeam />
      <Brands />
      <SectionSeam />
      <WhoItsFor />
      <SectionSeam />
      <HowItWorks />
      <SectionSeam />
      {/* The plain-English decoder sits BEFORE the module list, not after
          it. The whole point of it is that someone who has never posted
          learns what "hook" and "retention" actually mean — reading that
          after a curriculum written in those same words would be arriving
          with the translation once the page no longer needs it. */}
      <Outcomes />
      <SectionSeam />
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
        <CourseIntro />
        <div className="mt-16">
          <FullCurriculum />
        </div>
      </section>
      <SectionSeam />
      <Story />
      <SectionSeam />
      <FAQ />
      <SectionSeam />
      <Pricing />
    </>
  );
}
