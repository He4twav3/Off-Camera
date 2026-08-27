/**
 * THE PAGE'S ONE MOTION VOCABULARY.
 *
 * Before this existed, every section had invented its own timing: five
 * different per-item stagger rates (55, 60, 70, 110 and 130ms) and three
 * different header cadences were live on one page at the same time. None
 * of them were wrong individually, and together they were exactly why the
 * page felt like a set of well-made sections rather than one designed
 * thing — a reader can't name a 55ms-vs-110ms difference, but they feel a
 * page whose rhythm changes every time they scroll into a new block.
 *
 * So: every entrance on the site is one of these five numbers. A section
 * that wants a different feel changes which beat an element sits on, not
 * what the beats are.
 *
 *   eyebrow → title → lede   is the opening of every section, always in
 *                            that order and always at that spacing.
 *   body                     the first thing after a header. The gap
 *                            before it is deliberately larger than the
 *                            gaps inside the header: it's a paragraph
 *                            break, not another line.
 *   step                     one beat of a list, grid or row.
 *
 * THIS FILE HAS NO "use client" DIRECTIVE, AND THAT IS THE POINT. These
 * values are read by both server components (who-its-for, how-it-works,
 * story, pricing, the section header) and client ones (the curriculum,
 * the outcomes chips). They lived in reveal.tsx to begin with, which IS a
 * client module — and a server component importing a plain function out
 * of a client module does not get the function, it gets a client
 * reference proxy, so the first server render threw "Attempted to call
 * stagger() from the server". Shared values that cross that boundary have
 * to belong to neither side. Same reason module-icons.ts exists.
 */
export const BEAT = {
  eyebrow: 0,
  title: 90,
  lede: 170,
  body: 260,
  step: 70,
} as const;

/**
 * The delay for item `index` of a list that follows a section header.
 *
 * Capped at `cap` items on purpose. Uncapped, the twenty-eighth row of
 * the curriculum would be authored to arrive two seconds after the first
 * — long past the point where a stagger reads as choreography rather than
 * as the page being slow. After the cap, everything remaining arrives
 * together, which is what a wave hitting the bottom of a list should do.
 *
 * `fromHeader: false` for a list that is the first thing in its own
 * block, with no header above it to follow on from.
 */
export function stagger(index: number, { fromHeader = true, cap = 6 } = {}) {
  return (fromHeader ? BEAT.body : 0) + Math.min(index, cap) * BEAT.step;
}
