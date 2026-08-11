/**
 * Single source of truth for the course structure: module titles, lesson
 * names and durations. Both the public curriculum display
 * (full-curriculum.tsx) and the real per-account progress system
 * (progress.ts, dashboard components) read from this file so the two never
 * drift out of sync with each other or with the "8 modules, 25 lessons"
 * copy used across the site.
 */

function minutesFromDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

const RAW_CURRICULUM = [
  {
    title: "Module 1: Finding Your Niche Without Showing Your Face",
    preview: "1:32",
    description:
      "Pick an angle that plays to your strengths, even if you never want to be on camera.",
    lessons: [
      { name: "Why faceless content works (and where it doesn't)", duration: "6 min" },
      { name: "Auditing your strengths for a faceless format", duration: "8 min" },
      { name: "Picking a lane brands actually pay for", duration: "10 min" },
    ],
  },
  {
    title: "Module 2: The Anatomy of a Scroll-Stopping Hook",
    preview: "2:05",
    description:
      "The 3-second formulas that stop the scroll and keep people watching to the end.",
    lessons: [
      { name: "The 3-second rule", duration: "7 min" },
      { name: "12 hook formulas you can reuse forever", duration: "14 min" },
      { name: "Writing hooks for products vs. stories", duration: "9 min" },
      { name: "Voiceover pacing and delivery", duration: "8 min" },
    ],
  },
  {
    title: "Module 3: Filming & Editing on Just a Phone",
    preview: "2:41",
    description:
      "A repeatable, no-gear workflow for shooting and editing content brands actually want.",
    lessons: [
      { name: "Framing, lighting & sound without gear", duration: "12 min" },
      { name: "B-roll that keeps people watching", duration: "9 min" },
      { name: "A repeatable edit workflow (CapCut walkthrough)", duration: "18 min" },
      { name: "Captions, pacing & sound design basics", duration: "11 min" },
    ],
  },
  {
    title: "Module 4: Trend-Jacking Without Looking Desperate",
    preview: "1:10",
    description: "Ride a trend before it peaks, in a way that still sounds like you.",
    lessons: [
      { name: "Spotting trends before they peak", duration: "8 min" },
      { name: "Making a trend fit your niche", duration: "7 min" },
    ],
  },
  {
    title: "Module 5: Pitching Brands & Landing Your First Deal",
    preview: "2:20",
    description:
      "Outreach templates and pitch structures that get replies, not silence.",
    lessons: [
      { name: "Building a target brand list", duration: "9 min" },
      { name: "The cold pitch template that gets replies", duration: "11 min" },
      { name: "Following up without being annoying", duration: "6 min" },
      { name: "Handling objections and low offers", duration: "10 min" },
    ],
  },
  {
    title: "Module 6: Building a UGC Portfolio That Sells Itself",
    preview: "1:45",
    description:
      "Build a portfolio of spec content brands want to see, before you've landed a single deal.",
    lessons: [
      { name: "What actually belongs in a portfolio", duration: "7 min" },
      { name: "Creating spec content for brands you want", duration: "10 min" },
    ],
  },
  {
    title: "Module 7: Getting Picked for Campaigns",
    preview: "1:58",
    description:
      "How agencies and platforms actually choose creators, and how to show up on their radar.",
    lessons: [
      { name: "How agencies and platforms actually choose creators", duration: "9 min" },
      { name: "Where to list yourself (and what to skip)", duration: "8 min" },
      { name: "Staying top-of-mind for repeat bookings", duration: "7 min" },
    ],
  },
  {
    title: "Module 8: Pricing, Contracts & Getting Paid",
    preview: "2:12",
    description:
      "What to charge, what to put in writing, and how to avoid working for exposure.",
    lessons: [
      { name: "What to actually charge, by deliverable", duration: "10 min" },
      { name: "Contract must-haves (with template)", duration: "9 min" },
      { name: "Invoicing and getting paid on time", duration: "6 min" },
    ],
  },
] as const;

/**
 * One 8-step gradient of the single brand hue (terracotta, ~32°→22°) for
 * the module numbers — light-to-dark, not four colors repeated twice.
 * Lightness steps evenly from pale to near-black; chroma peaks in the
 * middle and tapers at both ends (flat chroma looks washed out pale and
 * muddy dark — this is how real color ramps, e.g. Tailwind's own, avoid
 * that). Text flips from ink to card at the lightness midpoint. Shared
 * source of truth for every place a module needs a color-coded index
 * (full-curriculum.tsx's numbered badges, curriculum-shelf.tsx's panels)
 * so the same module always reads as the same shade everywhere.
 */
export const MODULE_SHADES = [
  { bg: "oklch(0.88 0.06 32)", text: "var(--ink)" },
  { bg: "oklch(0.80 0.10 32)", text: "var(--ink)" },
  { bg: "oklch(0.71 0.15 31)", text: "var(--ink)" },
  { bg: "oklch(0.62 0.18 30)", text: "var(--ink)" },
  { bg: "oklch(0.53 0.18 28)", text: "var(--card)" },
  { bg: "oklch(0.44 0.16 26)", text: "var(--card)" },
  { bg: "oklch(0.35 0.13 24)", text: "var(--card)" },
  { bg: "oklch(0.27 0.1 22)", text: "var(--card)" },
] as const;

/**
 * Real video, once it exists: map a module id to an unlisted YouTube video
 * id here (works unlisted, doesn't need to be public) and that module's
 * preview card plays the real thing instead of the simulated placeholder —
 * see VideoPlayer's `youtubeId` prop. Kept separate from RAW_CURRICULUM so
 * adding real footage later is a one-line change per module, not a rewrite
 * of the lesson data. Left empty on purpose — placeholders, not stand-in
 * footage from other creators.
 */
export const MODULE_VIDEO_IDS: Partial<Record<string, string>> = {
  // m1: "your-youtube-id-here",
};

export const CURRICULUM = RAW_CURRICULUM.map((mod, moduleIndex) => {
  const id = `m${moduleIndex + 1}`;
  return {
    id,
    title: mod.title,
    preview: mod.preview,
    description: mod.description,
    youtubeId: MODULE_VIDEO_IDS[id],
    lessons: mod.lessons.map((lesson, lessonIndex) => ({
      id: `${id}-l${lessonIndex + 1}`,
      name: lesson.name,
      duration: lesson.duration,
      minutes: minutesFromDuration(lesson.duration),
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
