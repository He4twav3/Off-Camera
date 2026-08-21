import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseHero } from "@/components/marketing/course-hero";
import { FullCurriculum } from "@/components/marketing/full-curriculum";
import { PurchaseCard } from "@/components/marketing/purchase-card";
import { Story } from "@/components/marketing/story";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQ } from "@/components/marketing/faq";
import { CourseJsonLd } from "@/components/marketing/course-json-ld";
import { Reveal } from "@/components/marketing/reveal";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "The Course",
  description: `8 modules, 25 lessons: everything you need to create faceless content, pitch it to brands, and keep getting picked for campaigns. ${siteConfig.price.formatted}, one-time, lifetime access.`,
  alternates: {
    canonical: "/course",
  },
};

export default function CoursePage() {
  return (
    <>
      <CourseJsonLd />
      <Reveal>
        <CourseHero />
      </Reveal>

      {/*
        Not wrapped in <Reveal>: the purchase card inside is
        `lg:sticky`, and an ancestor with a CSS transform (which the
        reveal animation applies while running) can interfere with
        sticky positioning. Not worth the risk for one section — the
        accordion expand/collapse already supplies plenty of motion here.
      */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_22rem]">
          <Suspense fallback={<div id="curriculum" className="h-40" />}>
            <FullCurriculum />
          </Suspense>
          {/*
            Two nested divs on purpose: this outer one stays default
            height (stretches to match the curriculum column's height,
            same grid row). The inner one holds the actual `sticky`.
            Collapsing these into one element with both `sticky` and
            `self-start` is a classic CSS Grid trap — self-start shrinks
            the item to its content height, which then becomes its own
            sticky containing block, so it runs out of room to stick
            almost immediately instead of tracking the full row.
          */}
          <div>
            <div className="lg:sticky lg:top-24">
              <PurchaseCard />
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <Story />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <Reveal>
        <FAQ />
      </Reveal>
    </>
  );
}
