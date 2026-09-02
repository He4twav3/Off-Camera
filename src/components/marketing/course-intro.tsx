import { BookOpen, Clock, Infinity as InfinityIcon } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { TOTAL_MODULES, TOTAL_LESSONS, TOTAL_MINUTES } from "@/lib/curriculum";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { SectionHeader } from "@/components/marketing/section-frame";

/**
 * The product's own name and stats, real this time — dynamic
 * TOTAL_MODULES/TOTAL_LESSONS/TOTAL_MINUTES, not the hardcoded "8
 * modules · 25 lessons" the old, separate /course page's CourseHero
 * had (stale the moment the curriculum changed, exactly the drift this
 * file avoids by computing instead of restating). Sits right above the
 * full curriculum breakdown on the homepage now that /course is gone —
 * this is the one place that names the actual product before showing
 * everything inside it.
 *
 * This is the page's turn: everything above it is the problem and the
 * evidence, everything below it is the answer. So it gets the biggest
 * heading of any section and the product's real name set as the title,
 * rather than the badge-plus-eyebrow-plus-heading stack it used to open
 * with — three separate small elements before the actual claim was
 * three chances to lose someone at the most important moment on the page.
 */
export function CourseIntro() {
  const meta = [
    { icon: BookOpen, label: `${TOTAL_MODULES} modules · ${TOTAL_LESSONS} lessons` },
    { icon: Clock, label: `~${(TOTAL_MINUTES / 60).toFixed(1)} hours` },
    { icon: InfinityIcon, label: "Lifetime access" },
  ];

  return (
    <SectionHeader
      index="04"
      eyebrow="So how do you actually do this"
      title={siteConfig.courseTitle}
      lede="The system behind content that performs: hooks, retention, volume, consistency, timing, and iteration, across every format. No following required, and your face is optional."
    >
      {/* The three facts someone checks before they take a course
          seriously: how much of it there is, how long it takes, and how
          long they keep it. Set as a read-out row rather than as chips —
          same mono/tracked treatment as every other piece of metadata on
          the page. */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
        {meta.map((item, i) => (
          <Reveal key={item.label} delay={stagger(i)}>
            <span className="pill-premium inline-flex items-center gap-2.5 rounded-full bg-surface-1/70 px-4 py-2 text-[0.7rem] font-medium tracking-[0.1em] text-muted-foreground uppercase backdrop-blur-sm">
              <item.icon className="size-3.5 text-signal" strokeWidth={1.75} />
              {item.label}
            </span>
          </Reveal>
        ))}
      </div>
    </SectionHeader>
  );
}
