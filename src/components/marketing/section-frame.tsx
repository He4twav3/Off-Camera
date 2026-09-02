import type { ReactNode } from "react";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { LitWords } from "@/components/marketing/lit-words";
import { cn } from "@/lib/utils";

/**
 * The page's rhythm, defined once.
 *
 * Before this existed, every section opened slightly differently — its
 * own heading size, its own gap above the lede, its own idea of whether
 * there was an eyebrow — which is most of why the page read as "flat
 * sections stacked vertically" rather than as one document. Sections
 * that don't share an opening cadence can't build momentum between
 * them, no matter how good each one looks alone.
 *
 * So every section below the hero now opens the same way, in the same
 * beats, at the same tempo:
 *
 *   01 ── EYEBROW         a chapter number, a hairline, a tracked label
 *   Heading                the claim, lit from above
 *   Lede                   one paragraph, never more
 *
 * The chapter number is the quiet motivational device in the whole
 * system: it tells the reader this is a structured argument they are
 * moving through, with a beginning and an end, rather than a scroll that
 * might go on forever. That is a large part of the difference between
 * "a fun course website" and "a serious thing I could commit to".
 */
export function SectionEyebrow({
  index,
  label,
  align = "center",
  className,
}: {
  /** Chapter number, e.g. "01". Renders in the silver read-out tone. */
  index?: string;
  label: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      {index && (
        <span className="font-mono text-xs font-semibold tracking-[0.2em] text-signal tabular-nums">
          {index}
        </span>
      )}
      <span className="rule-fade-bright h-px w-8 shrink-0" aria-hidden />
      <span className="text-[0.7rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

/**
 * Eyebrow + heading + lede, revealed as one staggered beat. `align`
 * exists because two sections (curriculum, story) are genuinely
 * left-aligned inside their own column — everything else is centered.
 */
export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  align = "center",
  className,
  children,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "center" | "start";
  className?: string;
  /** Anything that belongs directly under the lede, e.g. a meta row. */
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left",
        className
      )}
    >
      <Reveal>
        <SectionEyebrow index={index} label={eyebrow} align={align} />
      </Reveal>
      {/* A plain string title gets the word-by-word light-up (see
          LitWords); a ReactNode title is passed through untouched, since
          splitting arbitrary markup on spaces would destroy it. Every
          section heading on this page is a plain string today, so in
          practice they all get it — the escape hatch just means a future
          heading with an inline <span> or <br> can't silently break.

          font-wordmark + font-bold: every numbered chapter title on the
          page, the second of only two places (with the hero's own h1)
          that get the logo's own face (Bricolage Grotesque) instead of
          DM Sans — see hero.tsx's matching note and layout.tsx's header
          comment for why these two and nothing else. font-bold (700),
          not font-semibold (600): 600 isn't one of the weights that face
          is actually loaded at. */}
      <Reveal delay={BEAT.title}>
        {typeof title === "string" ? (
          <LitWords
            as="h2"
            className="text-lit font-wordmark mt-5 text-3xl leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[2.6rem]"
          >
            {title}
          </LitWords>
        ) : (
          <h2 className="text-lit font-wordmark mt-5 text-3xl leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[2.6rem]">
            {title}
          </h2>
        )}
      </Reveal>
      {lede && (
        <Reveal delay={BEAT.lede}>
          <p
            className={cn(
              "mt-5 text-[1.0625rem] leading-relaxed text-muted-foreground text-pretty",
              centered && "mx-auto"
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  );
}

/**
 * The seam between two sections.
 *
 * A page of full-bleed dark sections has no natural boundaries — content
 * just stops and other content starts. This draws the boundary as light
 * rather than as a line: a hairline that fades to nothing at both edges,
 * with a soft bloom sitting on it. It reads as the far edge of one lit
 * space meeting the near edge of the next, which is the cinematic
 * version of a horizontal rule.
 */
export function SectionSeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8", className)}
    >
      <div className="rule-fade" />
      <div className="absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(ellipse_46%_100%_at_50%_50%,oklch(1_0_0_/_0.035)_0%,transparent_70%)]" />
    </div>
  );
}
