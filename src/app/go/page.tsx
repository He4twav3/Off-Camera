import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";
import { PriceTag } from "@/components/marketing/price-tag";
import { FinalCTA } from "@/components/marketing/final-cta";
import { SymbolField } from "@/components/marketing/symbol-field";
import { Reveal } from "@/components/marketing/reveal";
import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { LiquidFrame } from "@/components/media/liquid-frame";
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MODULES, TOTAL_MINUTES } from "@/lib/curriculum";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Start here",
  description: `${siteConfig.description} ${siteConfig.price.formatted}, one-time, lifetime access.`,
  alternates: { canonical: "/go" },
};

const proof = [
  { value: "$180K+", label: "earned by students in brand deals" },
  { value: `${TOTAL_MODULES} modules`, label: `${TOTAL_LESSONS} lessons, ~${(TOTAL_MINUTES / 60).toFixed(1)}h` },
  { value: "500+", label: "students taught" },
];

const inclusions = [
  "8 core modules, 25 lessons",
  "Pitch & contract templates",
  "Private student community",
  "Lifetime access + future updates",
  "Campaign application checklist",
];

const testimonials = [
  {
    initials: "JM",
    name: "Jamie M.",
    quote:
      "I didn't think faceless content could actually make money. Two months in, I had three brands reaching out to me instead of the other way around.",
    duration: "0:42",
  },
  {
    initials: "PK",
    name: "Priya K.",
    quote:
      "The pitching templates alone paid for the course ten times over. I finally understood what brands were actually looking for.",
    duration: "0:38",
  },
];

const faqs = [
  {
    question: "Do I really never have to show my face?",
    answer:
      "Correct. Every technique in this course, hooks, filming, editing, pitching, is built around faceless formats: voiceovers, hands-only shots, screen content, and b-roll.",
  },
  {
    question: "Do I need followers or expensive gear to start?",
    answer:
      "No to both. Everything works with zero followers and just your phone. Module 1 is specifically about starting from nothing.",
  },
  {
    question: "How long do I have access for?",
    answer: "Lifetime access, including future updates to the course content. Pay once, keep it.",
  },
  {
    question: "What if it's not for me?",
    answer:
      "Read through the module list below and watch the intro video first, that's exactly what they're there for. Once you're enrolled, you get instant access to all modules.",
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
      <SymbolField className="fixed inset-0 -z-10" />

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
            A course by a working UGC creator
          </span>
          <h1 className="text-sticker mx-auto mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Go viral without showing your face.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
            The exact system used to land a first paid brand deal in weeks,
            with no followers, no camera, no expensive gear.
          </p>

          <div className="mt-8">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="#enroll" />}
              className="btn-sticker"
            >
              Enroll now · {siteConfig.price.formatted}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              One-time payment · Lifetime access
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 lg:px-8">
          <LiquidFrame variant={0} radius="1rem" thickness="1.25rem">
            <VideoPlayer
              aspect="video"
              label="Intro from Aron · 1:12"
              durationSeconds={72}
              youtubeId={siteConfig.videos.intro}
              poster={
                <VideoPoster>
                  <p className="max-w-sm text-balance text-lg font-medium sm:text-xl">
                    &ldquo;Here&apos;s exactly how I went from zero to
                    full-time, without ever showing my face.&rdquo;
                  </p>
                </VideoPoster>
              }
            />
          </LiquidFrame>
        </section>

        <Reveal>
          <section className="border-y-[3px] border-ink bg-secondary/40">
            <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4 px-4 py-10 sm:px-6 lg:px-8">
              {proof.map((p) => (
                <div
                  key={p.label}
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
              href="/course#curriculum"
              className="mt-4 inline-block text-sm font-medium underline underline-offset-2 hover:text-primary"
            >
              See the full lesson-by-lesson breakdown →
            </Link>
          </section>
        </Reveal>

        <Reveal>
          <section className="border-y border-border/70 bg-secondary/40">
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
              <h2 className="text-sticker-sm text-center text-2xl font-semibold tracking-tight">
                Students who made the leap
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                AI-generated example videos, illustrating the kind of results
                students describe.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {testimonials.map((t) => (
                  <Card key={t.name} className="card-sticker gap-3 rounded-2xl bg-card">
                    <CardContent className="flex h-full flex-col">
                      <VideoThumbnail
                        aspect="portrait"
                        poster={
                          <VideoPoster variant="muted">
                            <span className="font-heading text-2xl font-semibold">
                              {t.initials}
                            </span>
                          </VideoPoster>
                        }
                        label={t.name}
                        duration={t.duration}
                        badge="AI-generated"
                        dialogTitle={`AI-generated example video, styled as a testimonial from ${t.name}`}
                        className="mb-1 border-2 border-ink"
                      />
                      <div className="mt-2 flex gap-0.5 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="mt-2 flex-1 text-sm leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <p className="mt-3 text-sm font-medium">{t.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                <PriceTag variant="base">{siteConfig.price.formatted} one-time</PriceTag>
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
                render={<Link href="/checkout" />}
                className="btn-sticker mt-8 w-full"
              >
                Enroll now
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
              href="/course#faq"
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
