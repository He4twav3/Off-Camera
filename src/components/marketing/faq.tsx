import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

/**
 * Rewritten from scratch around two rules, not just a copy edit:
 *
 * 1. Every question here is one a genuinely interested buyer actually
 *    asks before joining a course like this — not a hedge or an
 *    objection we invented to pre-empt. The old "Will I go viral if I
 *    finish this course?" led with "No one can promise that, and we
 *    won't" — a fear-based question answered with a disclaimer, which
 *    reads as talking someone out of it, not into it. Replaced with
 *    questions people are actually optimistic about (what they'll be
 *    able to do, how this compares to free content, what a slow start
 *    actually means) so the section closes the sale instead of planting
 *    doubt.
 * 2. No answer teaches the actual methodology. Landing-page copy says
 *    what you'll learn and why it matters, never how the mechanism
 *    itself works — that's the paid course's job. The old viral-question
 *    answer explained the real account-trust mechanism in enough detail
 *    to be a free lesson; every answer below stays one level up from
 *    that, on purpose.
 */
const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "Do I have to show my face?",
    answer:
      "No, and you don't have to avoid it either. The course covers on-camera, hands-free, and completely silent formats, so you build with whatever you're actually comfortable with. Several of the real videos in the proof section above never show a face at all.",
  },
  {
    question: "Do I need a following or expensive equipment to start?",
    answer:
      "Neither. Every real video in the proof section above was made with a phone and no existing audience. If you're starting from zero, you're starting exactly where this course expects you to.",
  },
  {
    question: "What will I actually be able to do by the end of this?",
    answer:
      "Plan, film, and post content built to perform, on purpose, not as a one-off lucky video. You'll know how to open a video so people stop scrolling, keep them watching once they do, and turn what happens after each post into a stronger next one. Making content that actually gets watched stops feeling like guesswork.",
  },
  {
    question: "How is this different from free tips I could find online?",
    answer:
      "Free content online is scattered, and most of it is theory nobody has actually tested. This course is the complete, structured version of a system we used ourselves, the proof section above shows the real videos it produced. You're not piecing together random tips; you're learning the whole thing, in order, the way it's actually meant to be applied.",
  },
  {
    question: "What if my first few videos don't perform the way I want?",
    answer:
      "Completely normal, and it's part of the process, not a sign anything's wrong. You'll learn how to read what a video's numbers are actually telling you, so a quiet post becomes information you use, not a dead end. Creators who stay consistent improve fast, because they know what to adjust and why.",
  },
  {
    question: "Is this only for TikTok?",
    answer:
      "No. The same principles apply across TikTok, Instagram Reels, and YouTube Shorts, and the course covers where the platforms genuinely differ so you're never just guessing which parts carry over.",
  },
  {
    question: "How long do I have access?",
    answer: "Lifetime access, including any future updates to the course.",
  },
  {
    question: "Can this lead to real brand opportunities?",
    answer:
      "It can. Creators who show they can actually produce content that performs may be introduced to real brand opportunities through our creator network. It's earned through demonstrated ability, not handed out for finishing, but it's a real, active path, not a hypothetical one.",
  },
  {
    question: "What if I get stuck or have questions?",
    answer: (
      <>
        You&apos;re not on your own. You get access to the private
        student community for that, or you can email{" "}
        {siteConfig.contactEmail} directly and get a real answer.
      </>
    ),
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-20 lg:scroll-mt-32">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          index="08"
          eyebrow="Before you decide"
          title="Frequently asked questions"
        />

        {/* Sits directly on the page — no card, no raised surface. Same
            change as the curriculum accordion right above it on the
            page: still fully expandable, just without the boxed
            container around the rows. */}
        <Accordion className="mt-14">
          {faqs.map((faq, i) => (
            // Divider drawn explicitly on the Reveal wrapper, same reason
            // as full-curriculum.tsx: AccordionItem's own `not-last:border-b`
            // can't see its real siblings once each row is individually
            // wrapped for the per-row reveal animation.
            <Reveal
              key={faq.question}
              delay={stagger(i)}
              className={cn(i < faqs.length - 1 && "border-b border-hairline")}
            >
              <AccordionItem value={`item-${i}`} className="border-b-0">
                <AccordionTrigger className="py-5 text-left text-[0.95rem] font-semibold no-underline hover:no-underline sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </Reveal>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
