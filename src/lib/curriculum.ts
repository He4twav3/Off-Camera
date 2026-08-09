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
    lessons: [
      { name: "Why faceless content works (and where it doesn't)", duration: "6 min" },
      { name: "Auditing your strengths for a faceless format", duration: "8 min" },
      { name: "Picking a lane brands actually pay for", duration: "10 min" },
    ],
  },
  {
    title: "Module 2: The Anatomy of a Scroll-Stopping Hook",
    preview: "2:05",
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
    lessons: [
      { name: "Spotting trends before they peak", duration: "8 min" },
      { name: "Making a trend fit your niche", duration: "7 min" },
    ],
  },
  {
    title: "Module 5: Pitching Brands & Landing Your First Deal",
    preview: "2:20",
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
    lessons: [
      { name: "What actually belongs in a portfolio", duration: "7 min" },
      { name: "Creating spec content for brands you want", duration: "10 min" },
    ],
  },
  {
    title: "Module 7: Getting Picked for Campaigns",
    preview: "1:58",
    lessons: [
      { name: "How agencies and platforms actually choose creators", duration: "9 min" },
      { name: "Where to list yourself (and what to skip)", duration: "8 min" },
      { name: "Staying top-of-mind for repeat bookings", duration: "7 min" },
    ],
  },
  {
    title: "Module 8: Pricing, Contracts & Getting Paid",
    preview: "2:12",
    lessons: [
      { name: "What to actually charge, by deliverable", duration: "10 min" },
      { name: "Contract must-haves (with template)", duration: "9 min" },
      { name: "Invoicing and getting paid on time", duration: "6 min" },
    ],
  },
] as const;

/**
 * Real video, once it exists: map a module id to an unlisted YouTube video
 * id here (works unlisted, doesn't need to be public) and that module's
 * preview card plays the real thing instead of the simulated placeholder —
 * see VideoPlayer's `youtubeId` prop. Kept separate from RAW_CURRICULUM so
 * adding real footage later is a one-line change per module, not a rewrite
 * of the lesson data.
 *
 * The ids below are real, publicly posted, topically-matched YouTube
 * videos from other creators, standing in for the real course footage so
 * the site's video sections can be previewed with actual playing video
 * instead of flat placeholders. Swap each one for the real recorded
 * lesson before this goes live — they're a preview aid, not final content.
 */
export const MODULE_VIDEO_IDS: Partial<Record<string, string>> = {
  m1: "C2cxKRNZ_30", // "AI Influencer UGC Videos in 5 Minutes – Faceless & Automated!"
  m2: "OyFwb8ha5Hg", // "7 TikTok Hooks That Actually Make You Go Viral (Copy These)"
  m3: "sqMhWmeu7p4", // "Filming on an iPhone just got easier for everyone"
  m4: "JvcnvY3S5mU", // "How to Make Trend Videos Before Everyone Moves On"
  m5: "S3Xdu0WIdfY", // "How to pitch brands to land PAID brand deals (UGC)"
  m6: "HpKOyNLnqiY", // "UGC Portfolio for Beginners"
  m7: "SW16BP9cjyk", // "How To Create a UGC Portfolio That Lands Brand Deals Even with 0 Followers"
  m8: "GgdRJfpqIbs", // "How to Get Paid for Your UGC Content"
};

export const CURRICULUM = RAW_CURRICULUM.map((mod, moduleIndex) => {
  const id = `m${moduleIndex + 1}`;
  return {
    id,
    title: mod.title,
    preview: mod.preview,
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
