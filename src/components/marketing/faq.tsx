import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/lib/site-config";
import { MascotSpiky } from "@/components/illustrations/mascots";

const faqs: { question: string; answer: ReactNode }[] = [
  {
    question: "Do I really never have to show my face?",
    answer:
      "Correct. Every technique in this course, hooks, filming, editing, pitching, is built around faceless formats: voiceovers, hands-only shots, screen content, and b-roll.",
  },
  {
    question: "Do I need followers or expensive gear to start?",
    answer:
      "No to both. Everything in this course works with zero followers and just your phone. Module 1 is specifically about starting from nothing. Brands hiring UGC creators care about the content, not your follower count.",
  },
  {
    question: "What equipment do I need to start?",
    answer:
      "Just a smartphone. We cover lighting and framing tricks that work with what you already have, no camera or studio setup required.",
  },
  {
    question: "How long until I can start pitching brands?",
    answer:
      "Most students send their first pitch by the end of module 5, usually within 2–3 weeks of starting at a casual pace.",
  },
  {
    question: "Is this only for TikTok?",
    answer:
      "No, the same content and pitching principles apply across TikTok, Instagram Reels, and YouTube Shorts. We cover platform-specific tweaks where they matter.",
  },
  {
    question: "How long do I have access for?",
    answer:
      "Lifetime access, including future updates to the course content. Pay once, keep it.",
  },
  {
    question: "What if I get stuck or have questions?",
    answer: (
      <>
        You get access to the private student community for that, or you can
        email {siteConfig.contactEmail} directly.
      </>
    ),
  },
  {
    question: "What if it's not for me?",
    answer:
      "Watch the intro video and read through the curriculum below first, that's exactly what they're there for. Once you're enrolled, you get instant access to all 8 modules, so take a proper look before you do.",
  },
  {
    question: "Is this available anywhere besides this site?",
    answer:
      "It may also be listed on marketplaces like Whop or Gumroad. Pricing is the same wherever you find it.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3">
          <MascotSpiky variant="strong" className="hidden w-10 sm:block" />
          <h2 className="text-sticker text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <Accordion className="mt-10">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
