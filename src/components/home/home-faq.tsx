import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";

const faqs = [
  {
    question: "Does it cost anything to join?",
    answer: "Creating an account is free, for brands and for creators.",
  },
  {
    question: "How do brands get started?",
    answer:
      "Create a brand account. We review new brands by hand, then set up your campaigns with you and put creators on them.",
  },
  {
    question: "Who can join as a creator?",
    answer:
      "Anyone can create an account. We review every creator profile by hand before they can apply to campaigns, and creators complete our free course first.",
  },
  {
    question: "How do you know a creator’s accounts are theirs?",
    answer:
      "Creators verify each handle by adding a short code to that account’s bio, which we then check. Verified accounts are marked as such.",
  },
  {
    question: "How are views tracked?",
    answer:
      "When a creator submits their post, we count its views and keep updating them daily, so the numbers you see in your dashboard stay current. We track YouTube, TikTok and Instagram.",
  },
  {
    question: "Which platforms do you work with?",
    answer: "TikTok, Instagram and YouTube Shorts.",
  },
];

export function HomeFAQ() {
  return (
    <section id="faq" className="relative scroll-mt-28">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-wordmark text-center text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-5xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Accordion className="mt-12 flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <Reveal key={faq.question} delay={stagger(i, { cap: 2 })}>
              <AccordionItem
                value={`item-${i}`}
                className="rounded-2xl border border-hairline bg-surface-2 px-5 not-last:border-b"
              >
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
