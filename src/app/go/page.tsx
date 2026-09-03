import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { PriceTag } from "@/components/marketing/price-tag";
import { FinalCTA } from "@/components/marketing/final-cta";
import { Reveal } from "@/components/marketing/reveal";
import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MODULES, TOTAL_MINUTES } from "@/lib/curriculum";
import { PROOF_CONTENT } from "@/lib/proof-content";
import { siteConfig } from "@/lib/site-config";
import { COURSE_IS_FREE } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Start here",
  description: `${siteConfig.description} ${siteConfig.price.formatted}, one-time, lifetime access.`,
  alternates: { canonical: "/go" },
};

// Only confirmed-real numbers — see proof-content.ts's own note on why
// past student-earnings/count figures were dropped rather than kept as
// placeholders. Same curation as stats.tsx: headline (M+) numbers only,
// and `statsLabel` (a rounded floor number, e.g. "15M+") when an entry
// has one, so this strip stays consistent with the main homepage one.
const proof = [
  ...PROOF_CONTENT.filter((entry) => entry.views?.includes("M")).map((entry) => ({
    value: entry.statsLabel ?? entry.views!,
    label: "views on a single video",
  })),
  { value: `${TOTAL_MODULES} modules`, label: `${TOTAL_LESSONS} lessons, ~${(TOTAL_MINUTES / 60).toFixed(1)}h` },
];

const inclusions = [
  `${TOTAL_MODULES} core modules, ${TOTAL_LESSONS} lessons`,
  "Pitch & contract templates",
  "Private student community",
  "Lifetime access + future updates",
  "Campaign application checklist",
];

const faqs = [
  {
    question: "Do I have to show my face?",
    answer:
      "No, but you don't have to avoid it either. The system works whether you're on camera, not showing your face, or completely silent.",
  },
  {
    question: "Do I need followers or expensive gear to start?",
    answer:
      "No to both. Everything works with zero followers and just your phone.",
  },
  {
    question: "Will I go viral if I finish this course?",
    answer:
      "No one can promise that. What it teaches is the process that gives your content a much better chance, then how to test and iterate.",
  },
  {
    question: "How long do I have access for?",
    answer: "Lifetime access, including future updates to the course content. Pay once, keep it.",
  },
  {
    question: "What if it's not for me?",
    answer:
      "Watch the intro video and the module list below first, that's exactly what they're there for. Once you're enrolled, you get instant access to every module.",
  },
];

/**
 * A short, standalone conversion page, deliberately outside the
 * (marketing) route group so it skips the full site nav, section pills,
 * and search: built to be the one link you hand to paid traffic or drop
 * into a Whop/Gumroad listing, where the goal is one scroll, one decision.
 * The full site is still one click away, nothing here is hidden from it.
 */
export default function GoPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Already enrolled? Log in
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <span className="pill-outline inline-flex rounded-full bg-toy-soft px-3 py-1 text-xs font-semibold text-toy-soft-foreground">
            Built on real results, not theory
          </span>
          <h1 className="text-sticker mx-auto mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            You don&apos;t need a following to get views.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
            You need content people want to watch. We&apos;ve made videos
            that reached millions of views with no following and no
            expensive gear. Here&apos;s the system behind them.
          </p>

          <div className="mt-8">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={siteConfig.communityUrl ?? "/signup"} target="_blank" rel="noopener noreferrer" />}
              className="btn-sticker"
            >
              Join free on Discord
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              {COURSE_IS_FREE ? "Free right now · No card required" : "One-time payment · Lifetime access"}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:px-8">
          <VideoPlayer
            aspect="video"
            label="Intro from Aron"
            poster={
              <VideoPoster>
                <p className="max-w-sm text-balance text-lg font-medium sm:text-xl">
                  &ldquo;We didn&apos;t guess what would work. We tested
                  it, and it reached millions of views.&rdquo;
                </p>
              </VideoPoster>
            }
          />
        </section>

        <Reveal>
          <section className="border-y-[3px] border-ink bg-secondary/40">
            <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4 px-4 py-10 sm:px-6 lg:px-8">
              {proof.map((p) => (
                <div
                  key={p.value}
                  className="pill-outline w-36 rounded-2xl bg-toy-soft px-3 py-4 text-center text-toy-soft-foreground"
                >
                  <p className="font-heading text-2xl font-semibold">{p.value}</p>
                  <p className="mt-1 text-xs font-medium opacity-80">{p.label}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-sticker-sm text-2xl font-semibold tracking-tight">
              What&apos;s inside
            </h2>
            <p className="mt-2 text-muted-foreground">
              {TOTAL_MODULES} modules, {TOTAL_LESSONS} lessons, go at your own pace.
            </p>
            <ol className="mt-6 space-y-2.5">
              {CURRICULUM.map((mod, i) => (
                <li
                  key={mod.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold">
                    {i + 1}
                  </span>
                  {mod.title.replace(/^Module \d+:\s*/, "")}
                </li>
              ))}
            </ol>
            <Link
              href="/#curriculum"
              className="mt-4 inline-block text-sm font-medium underline underline-offset-2 hover:text-primary"
            >
              See the full lesson-by-lesson breakdown →
            </Link>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-y border-border/70 bg-secondary/40">
            <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
              <h2 className="text-sticker-sm text-2xl font-semibold tracking-tight">
                See the proof
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The full video breakdowns, hook, format, retention, and
                what we learned, live on the main site.
              </p>
              <Link
                href="/#proof"
                className="mt-4 inline-block text-sm font-medium underline underline-offset-2 hover:text-primary"
              >
                Watch the breakdowns →
              </Link>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section id="enroll" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="card-sticker mx-auto rounded-2xl bg-card p-6 sm:p-7">
              <span className="inline-flex items-center rounded-full border-2 border-ink bg-accent px-3 py-1 text-xs font-bold">
                {siteConfig.name} · Full Course
              </span>
              <div className="mt-5">
                <PriceTag variant="base">
                  {COURSE_IS_FREE ? "Free right now" : `${siteConfig.price.formatted} one-time`}
                </PriceTag>
              </div>
              <ul className="mt-6 space-y-3">
                {inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={siteConfig.communityUrl ?? "/signup"} target="_blank" rel="noopener noreferrer" />}
                className="btn-sticker mt-8 w-full"
              >
                Join free on Discord
              </Button>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-sticker-sm text-center text-2xl font-semibold tracking-tight">
              Quick questions
            </h2>
            <div className="mt-8 space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-sm font-semibold">{faq.question}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
            <Link
              href="/#faq"
              className="mt-6 inline-block text-sm font-medium underline underline-offset-2 hover:text-primary"
            >
              See all questions →
            </Link>
          </section>
        </Reveal>

        <Reveal>
          <FinalCTA />
        </Reveal>
      </main>

      <footer className="border-t border-border/70 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          <Link href="/" className="hover:text-foreground">See the full site →</Link>
        </div>
        <p className="mt-3">© 2026 {siteConfig.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
