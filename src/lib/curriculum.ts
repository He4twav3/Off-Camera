/**
 * Single source of truth for the course structure: module titles, lesson
 * names, durations, and teaching notes. Both the public curriculum
 * display (full-curriculum.tsx) and the real per-account progress system
 * (progress.ts, dashboard components) read from this file so the two never
 * drift out of sync with each other or with the module/lesson-count copy
 * used across the site (always read TOTAL_MODULES/TOTAL_LESSONS below
 * rather than hardcoding a count — that's exactly what went stale before).
 *
 * Structure: 8 modules built around the transferable mechanics behind
 * content that performs (hook, retention, volume, consistency, timing,
 * iteration, format, monetization) — not a tour of one format. The real
 * proof (our own high-performing videos) lives on the marketing pages'
 * Proof Showcase (see proof-content.ts), not duplicated as a course
 * module — the course teaches the system those videos came from.
 *
 * Each lesson's `notes` is real teaching content (attention/retention
 * mechanics, not claims about any specific unseen video's performance),
 * plus, where it applies, the two real concepts described directly by
 * the founder — the silent, outcome-reframed product demo, and the
 * natural-feeling UGC approach — used as named case studies in Module 7
 * rather than left as a bare lesson title. `notes` is NOT public-facing
 * copy, unlike title/description/practice below — it's real methodology,
 * detailed enough to teach the actual mechanism, so full-curriculum.tsx
 * (the public landing page) deliberately never renders it. Kept here as
 * real data for a future paid/dashboard lesson view, not deleted just
 * because nothing public shows it right now.
 *
 * This file is Knowledge Base B (paid course content) in the two-
 * knowledge-base split: proof-content.ts is Knowledge Base A (our real
 * published videos — public, free, drives the methodology). This file
 * is the training itself — module/lesson `title`/`description`/`practice`
 * are the public-safe summary copy (what you're buying, not the lesson
 * itself — see `notes` above for the one field that's the exception); no
 * video from here is ever shown on a public/marketing page (see
 * MODULE_VIDEO_IDS's own note below) until it's behind the payment + auth
 * gate. When real course lesson footage is provided later, these
 * descriptions get rewritten from what's actually taught — don't invent
 * that footage's specifics before then.
 */

function minutesFromDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

const RAW_CURRICULUM = [
  {
    title: "Module 1: Hook",
    description:
      "How to make someone stop scrolling in the first second, and why it works, not just a list of templates.",
    practice: "Write the same concept's hook 3 different ways, one per hook category.",
    lessons: [
      {
        name: "Why people stop scrolling in the first second",
        duration: "6 min",
        notes:
          "A viewer decides whether to keep watching within about a second, before they've consciously registered what the video is even about. The hook's job is to interrupt that reflex, not to slowly become interesting.",
      },
      {
        name: "10 hook categories and the psychology behind each",
        duration: "14 min",
        notes:
          "Curiosity, shock, contrarian, demonstration, result-first, problem, transformation, challenge, pattern interrupt, visual. Each one opens a different kind of loop the brain wants closed, that's the mechanism, the category is just the label.",
      },
      {
        name: "Writing hooks for a product vs. a story",
        duration: "9 min",
        notes:
          "A product hook usually leads with a claim or a result. A story hook leads with a moment or a stake. Using a story hook's structure on a product pitch (or vice versa) is a common reason content feels like an ad even when it isn't trying to.",
      },
      {
        name: "Reverse-engineering any video's hook in 60 seconds",
        duration: "8 min",
        notes:
          "A repeatable checklist for pulling apart the first few seconds of someone else's video to find the actual mechanism at work, not the surface-level trend it's wrapped in.",
      },
    ],
  },
  {
    title: "Module 2: Retention",
    description:
      "Structuring a video so people keep watching once you've stopped their scroll.",
    practice: "Storyboard one video's retention curve before you film it.",
    lessons: [
      {
        name: "Open loops, curiosity gaps, and pacing",
        duration: "10 min",
        notes:
          "A loop opened in the hook has to stay open long enough to matter and close at the right moment, resolved too early and the rest of the video is dead weight, dragged too long and people bail before the payoff.",
      },
      {
        name: "Structuring a video so the hook actually pays off",
        duration: "8 min",
        notes:
          "A hook that doesn't deliver what it promised costs you the next video, not just this one. Payoff placement is a structural decision, not an afterthought at the end.",
      },
      {
        name: "Where most videos lose viewers, and how to fix it",
        duration: "9 min",
        notes:
          "The mid-video drop-off is almost always a stretch with no visual or informational change, usually a setup or explanation. Breaking it into smaller beats fixes more of this than a better ending does.",
      },
    ],
  },
  {
    title: "Module 3: Volume",
    description:
      "Why more attempts beats chasing one \"perfect\" video, and a practical system for producing more without burning out.",
    practice: "Produce 5 hook variations for one concept in a single sitting.",
    lessons: [
      {
        name: "Why more attempts means more chances to find a winner",
        duration: "7 min",
        notes:
          "Treat content as a stream of small experiments, not individual bets. Most people quit after one or two videos that didn't work, those weren't failures, they were data points, and one video is never a large enough sample to draw a conclusion from.",
      },
      {
        name: "Building a concept bank so you're never starting from zero",
        duration: "9 min",
        notes:
          "A lightweight system for capturing an idea the moment you have it, so volume doesn't depend on being struck by inspiration on filming day.",
      },
      {
        name: "Batching and templating without sounding repetitive",
        duration: "10 min",
        notes:
          "Template the underlying structure, vary the surface: hook wording, visuals, product angle. That's what makes output feel fresh without reinventing the format from scratch every time.",
      },
    ],
  },
  {
    title: "Module 4: Consistency",
    description: "Why one good video isn't a strategy, and how to turn it into a repeatable habit.",
    practice: "Build a 2-week posting plan before you film anything.",
    lessons: [
      {
        name: "Why one good video isn't a strategy",
        duration: "6 min",
        notes:
          "One video performing is a data point, not a formula. Consistency is what turns a lucky hit into a system you can actually rely on.",
      },
      {
        name: "Building a posting cadence you can actually keep up",
        duration: "8 min",
        notes:
          "Pick a cadence based on your real production capacity, not an arbitrary \"post daily\" rule that burns you out in two weeks and does more damage than a slower, sustained pace.",
      },
      {
        name: "Staying stocked instead of scrambling for the next post",
        duration: "9 min",
        notes:
          "Buffer and backlog thinking: film several pieces in one sitting so posting never depends on same-day inspiration or energy.",
      },
    ],
  },
  {
    title: "Module 5: Timing & Distribution",
    description: "Understanding what actually influences early reach, and what doesn't.",
    practice: "Post the same concept at two different times and compare what happens.",
    lessons: [
      {
        name: "When you post, and why it matters less than you think",
        duration: "7 min",
        notes:
          "Posting time affects the first small wave of views, and that's about it, it's a minor lever compared to hook and retention. \"Best time to post\" is mostly a distraction from the variables that actually move the number.",
      },
      {
        name: "How content actually gets its first push",
        duration: "9 min",
        notes:
          "Platforms test a video with a small initial audience, then expand distribution based on early retention and engagement signals from that test group, not your follower count.",
      },
      {
        name: "Platform differences: TikTok, Reels, and Shorts",
        duration: "8 min",
        notes:
          "Real differences in discovery mechanics, caption and on-screen text conventions, and ideal length between the three, not just \"post everywhere and hope.\"",
      },
    ],
  },
  {
    title: "Module 6: Iteration",
    description: "Learning from what performs, and turning that into a stronger next attempt.",
    practice: "Take one of your own posted videos and make a stronger second version, based on the data.",
    lessons: [
      {
        name: "Reading performance data without overreacting to one video",
        duration: "8 min",
        notes:
          "What's signal versus noise in view and retention numbers, and the minimum sample you actually need before drawing a conclusion from them.",
      },
      {
        name: "What a video that didn't work is actually telling you",
        duration: "7 min",
        notes:
          "Diagnosing whether a miss was the hook, the retention structure, the timing, or just normal variance, before you \"fix\" the wrong thing based on a guess.",
      },
      {
        name: "Making a stronger second version",
        duration: "10 min",
        notes:
          "Change one variable at a time between versions, so you actually learn what moved the number instead of changing five things and staying just as unsure as before.",
      },
    ],
  },
  {
    title: "Module 7: Content Formats",
    description:
      "On camera, not showing your face, silent, UGC, demo, screen recording — the format changes, the formula doesn't.",
    practice: "Recreate one earlier concept in a format you haven't tried yet.",
    lessons: [
      {
        name: "On-camera content, using the same formula",
        duration: "7 min",
        notes:
          "The same hook and retention mechanics apply on camera. Being on camera adds trust and relatability, it doesn't replace the underlying mechanism, and it isn't a shortcut around a weak hook.",
      },
      {
        name: "Silent formats: hands-only, taped-mouth, text-led",
        duration: "10 min",
        notes:
          "Case study: a silent product demo built around an aspirational outcome (in one real example, framed as \"making a doctor's salary\") instead of a feature list, so the hook is the stakes, not the product. No one talks, and the video loses zero information, the visual carries the whole thing, watchable with sound off, which is most of a TikTok or Reels feed.",
      },
      {
        name: "UGC that doesn't feel like an ad",
        duration: "9 min",
        notes:
          "Case study: natural UGC built on a problem → demonstration → result structure, filmed like a real post, imperfect framing, raw delivery, no pitch language, so it reads as content that happens to feature a product rather than an ad that happens to be on the platform.",
      },
      {
        name: "Screen recordings, POV, and before/after",
        duration: "8 min",
        notes:
          "When each format actually fits: screen recordings for app or software demos, POV for immersion, before/after for a transformation claim that needs to be shown, not described.",
      },
    ],
  },
  {
    title: "Module 8: Monetization",
    description:
      "Turning content that performs into brand and UGC opportunities, for creators who qualify.",
    practice: "Build one piece of spec content for a brand you'd actually want to work with.",
    lessons: [
      {
        name: "Building a target list and the cold pitch that gets replies",
        duration: "11 min",
        notes:
          "What gets a pitch ignored (generic, no proof of work) versus answered (specific to the brand, links real content, states the mechanism you'd use for them).",
      },
      {
        name: "Building a portfolio that shows the formula, not just the footage",
        duration: "8 min",
        notes:
          "Frame each portfolio piece around the mechanism it used, hook type, format, structure, so a brand sees a repeatable skill, not one lucky clip they can't be sure you can repeat.",
      },
      {
        name: "How brands and the creator network actually pick people",
        duration: "9 min",
        notes:
          "What reviewers actually look for: consistency across pieces, range of formats, professionalism in how you present your work. Strong, demonstrated ability is what gets a creator considered for real opportunities, not course completion on its own.",
      },
      {
        name: "What to charge, by deliverable",
        duration: "10 min",
        notes:
          "Pricing by deliverable type and usage rights rather than a single flat rate, and why \"exposure\" was never a rate to begin with.",
      },
      {
        name: "Contracts, invoicing, and getting paid on time",
        duration: "9 min",
        notes:
          "The handful of contract terms that actually protect you (usage rights, payment terms, revision limits), and how to invoice in a way that doesn't leave you chasing brands for weeks.",
      },
    ],
  },
] as const;

/**
 * One 8-step ramp through the brand red, from a vivid crimson at module
 * one down into the deep maroon at module eight.
 *
 * The eight modules are a pipeline (hook → retention → volume → ...), and
 * the ramp is what makes a row of them read as a sequence going
 * somewhere rather than eight interchangeable chips. Lightness carries
 * the progression; hue drifts only 9° across the whole ramp (30° → 21°),
 * which is enough to deepen from red toward maroon without ever becoming
 * a different color.
 *
 * Two hard constraints on this ramp, both learned the hard way:
 *
 *   - It never goes light. The top step is L=0.50, not the L=0.68 it once
 *     was. Two reasons, and they happen to agree: above roughly L=0.55 a
 *     saturated red at this chroma stops reading as red and starts
 *     reading as peach/salmon, which is the pastel register this palette
 *     exists to avoid; and L=0.50 is also about where white text stops
 *     clearing 4.5:1, which these 12px semibold pill labels need. Chroma
 *     stays high (0.115–0.20) the whole way down — letting chroma fall
 *     away as it darkens is what turns a maroon into a brown.
 *   - Text stays light on every step. Because the ramp now tops out at
 *     L=0.50, white clears 4.5:1 on all eight, so there is no
 *     light-text/dark-text crossover to get wrong. That removes the
 *     entire class of bug this ramp used to have, where --ink resolving
 *     to near-white in dark mode put white text on the palest swatches.
 *     The literals below are theme-independent on purpose: --ink and
 *     --card flip meaning between the light theme and dark-invert.
 *
 * Shared source of truth for every place a module needs a shade-coded
 * index (full-curriculum.tsx's numbered badges, its pipeline strip, and
 * its module panels) so the same module always reads the same everywhere.
 */
const SHADE_TEXT_LIGHT = "oklch(0.98 0.01 25)";

// Dimmed a step from the original ramp (each stop -0.015 to -0.04 L,
// -0 to -0.005 C, tapering to nearly nothing by the bottom of the ramp
// since that end was already a dim maroon) — the top of the ramp in
// particular read as too vivid/glowing against the graphite page,
// competing with the crimson CTA for "the one bright thing here"
// instead of sitting in its own quieter register. Hue and the overall
// shape of the progression are unchanged; the chroma floor at the
// bottom step (0.115) is the same floor the original ramp documented,
// so it still doesn't fade into brown.
export const MODULE_SHADES = [
  { bg: "oklch(0.46 0.195 30)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.425 0.19 29)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.395 0.185 27)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.36 0.175 26)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.33 0.165 25)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.30 0.15 23)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.265 0.13 22)", text: SHADE_TEXT_LIGHT },
  { bg: "oklch(0.23 0.115 20)", text: SHADE_TEXT_LIGHT },
] as const;

/**
 * PAID lesson video, once it exists — for the "continue learning" player
 * inside the paywalled dashboard (continue-learning.tsx) only. Map a
 * module id to an unlisted YouTube video id here (works unlisted, doesn't
 * need to be public) and the signed-in, paid student's next-lesson card
 * plays the real thing instead of the simulated placeholder — see
 * VideoPlayer's `youtubeId` prop.
 *
 * Do NOT wire this into any marketing/public-page component
 * (full-curriculum.tsx) — that is text-only on
 * purpose, see this file's header note on the free-proof/paid-training
 * split (also documented in proof-content.ts). This id is only ever
 * fetched behind the payment + auth gate.
 *
 * Kept separate from RAW_CURRICULUM so adding real footage later is a
 * one-line change per module, not a rewrite of the lesson data. Left
 * empty on purpose — placeholders, not stand-in footage from other
 * creators.
 */
export const MODULE_VIDEO_IDS: Partial<Record<string, string>> = {
  // m1: "your-youtube-id-here",
};

export const CURRICULUM = RAW_CURRICULUM.map((mod, moduleIndex) => {
  const id = `m${moduleIndex + 1}`;
  return {
    id,
    title: mod.title,
    description: mod.description,
    practice: mod.practice,
    youtubeId: MODULE_VIDEO_IDS[id],
    lessons: mod.lessons.map((lesson, lessonIndex) => ({
      id: `${id}-l${lessonIndex + 1}`,
      name: lesson.name,
      duration: lesson.duration,
      minutes: minutesFromDuration(lesson.duration),
      notes: lesson.notes,
    })),
  };
});

export const ALL_LESSON_IDS = CURRICULUM.flatMap((mod) => mod.lessons.map((l) => l.id));
export const TOTAL_MODULES = CURRICULUM.length;
export const TOTAL_LESSONS = ALL_LESSON_IDS.length;
export const TOTAL_MINUTES = CURRICULUM.flatMap((m) => m.lessons).reduce(
  (sum, l) => sum + l.minutes,
  0
);
