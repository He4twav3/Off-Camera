"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CURRICULUM, MODULE_SHADES, TOTAL_MODULES, TOTAL_LESSONS, TOTAL_MINUTES } from "@/lib/curriculum";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT, stagger } from "@/components/marketing/motion";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import { MODULE_ICONS } from "@/components/marketing/module-icons";
import { cn } from "@/lib/utils";

const modules = CURRICULUM;

/**
 * Full lesson-by-lesson curriculum — the same detailed, searchable-once
 * component /course used to have exclusively, now the homepage's own
 * curriculum section (see (marketing)/page.tsx). The search input that
 * used to sit here was removed — this only ever lived on one page at a
 * time (28 lessons doesn't need a search box the way a real docs site
 * would), and it was one more input competing with the actual "get to
 * pricing" job this section has now that it's not sharing space with a
 * whole separate /course page anymore.
 */
export function FullCurriculum() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  return (
    // min-w-0: the rail's row doesn't wrap, so without this the grid/flex
    // item it sits in defaults to min-width: auto and grows to fit it
    // instead of letting the row's own overflow-x-auto scroll internally.
    <div id="curriculum" className="min-w-0 scroll-mt-20 lg:scroll-mt-32">
      <Reveal>
        {/* No chapter number: CourseIntro already opened chapter 04
            and this is the second half of it. Two numbers on one section
            reads as two sections that forgot to introduce themselves. */}
        <SectionEyebrow label="Everything inside" align="start" />
      </Reveal>
      {/* Kept at the old, tighter scale rather than promoted to the
          full section-heading size the other sections use. This is a
          sub-heading inside the course block that CourseIntro already
          opened — sizing it like a top-level section heading made the
          block read as two competing openings stacked on each other. */}
      <Reveal delay={BEAT.title}>
        <h2 className="text-premium-sm mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Every module, every lesson
        </h2>
      </Reveal>
      <Reveal delay={BEAT.lede}>
        <p className="mt-2 max-w-xl text-muted-foreground">
          The stages above, in order, with what you make in each one and
          the lessons inside it. {TOTAL_MODULES} modules,{" "}
          {TOTAL_LESSONS} lessons, roughly {(TOTAL_MINUTES / 60).toFixed(1)}{" "}
          hours. Go at your own pace.
        </p>
      </Reveal>

      {/* The lesson-level detail, under the rail rather than beside it.
          The rail answers "what are the eight stages and what does each
          one teach"; this answers "what are the actual lessons". They
          used to answer both at once — the accordion panel repeated the
          module description and the practice line verbatim, which are
          now the open rail card's own content — so the panel below is
          the lesson list and nothing else. Saying the same paragraph
          twice, forty pixels apart, is how a page starts feeling padded.

          Sits directly on the page — no card, no raised surface. Each
          row still opens/closes exactly as before (Accordion's own state
          is untouched); only the boxed container around all eight rows
          is gone, plus the hairline divider each row already drew
          between itself and the next. */}
      <Accordion
        className="mt-10"
        value={openItems}
        onValueChange={(value) => setOpenItems(value as string[])}
      >
        {modules.map((mod, i) => {
            const shade = MODULE_SHADES[i % MODULE_SHADES.length];
            const Icon = MODULE_ICONS[i];
            const isOpen = openItems.includes(mod.id);
            return (
              // AccordionItem's own `not-last:border-b` can't tell it's
              // "last" correctly once each item is individually wrapped
              // (it's always the sole child of its own Reveal div) — the
              // divider between rows is drawn here instead, explicitly, so
              // wrapping every module for the reveal-on-scroll animation
              // doesn't quietly drop the row dividers.
              <Reveal
                key={mod.title}
                delay={stagger(i)}
                className={cn(i < modules.length - 1 && "border-b border-hairline")}
              >
                <AccordionItem value={mod.id} id={`module-${mod.id}`} className="border-b-0">
                  <AccordionTrigger className="py-5 text-left text-base font-medium no-underline hover:no-underline">
                    <span className="flex min-w-0 items-center gap-4">
                      {/* The module's own step on the crimson→maroon ramp,
                          so a module reads as the same thing here as it
                          does in the rail above. */}
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 font-mono text-xs font-bold shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.14)] tabular-nums"
                        style={{ backgroundColor: shade.bg, color: shade.text }}
                      >
                        {i + 1}
                      </span>
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors duration-300",
                          isOpen ? "text-foreground" : "text-muted-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="truncate text-[0.95rem] font-semibold sm:text-base">
                        {mod.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    {/* Indented to the trigger's text column so the panel
                        reads as belonging to the row above it rather than
                        as a new block starting flush against the page's
                        own edge. */}
                    <div className="sm:pl-12">
                      {/* The concrete thing this module ends in. It used
                          to live on a hover-expanding rail above this
                          list; that rail was eight rows of "module name +
                          what it is", which is structurally the same
                          component as the plain-English section above —
                          the page was explaining the same eight modules
                          three separate times. The rail is gone and its
                          one piece of unique content, this line, moved
                          here. */}
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                        <span className="font-mono text-[0.7rem] tracking-[0.14em] text-signal uppercase">
                          You practice
                        </span>{" "}
                        <span className="text-foreground">{mod.practice}</span>
                      </p>
                      {/* Lesson name + duration only — not lesson.notes. That
                          field is real teaching content (the actual hook
                          categories, the actual retention mechanics, etc.),
                          which taught the methodology itself on a free public
                          page rather than showing what's inside without
                          teaching it. Left untouched in curriculum.ts for a
                          real dashboard lesson view later — this only stops
                          it from rendering here. */}
                      <ul className="space-y-0.5">
                        {mod.lessons.map((lesson) => (
                          <li
                            key={lesson.name}
                            className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 hover:bg-surface-2"
                          >
                            <span className="flex min-w-0 items-center gap-3 font-medium text-foreground">
                              <PlayCircle
                                className="size-4 shrink-0 text-muted-foreground"
                                strokeWidth={1.75}
                              />
                              <span className="truncate">{lesson.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                              {lesson.duration}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Reveal>
            );
          })}
      </Accordion>
    </div>
  );
}
