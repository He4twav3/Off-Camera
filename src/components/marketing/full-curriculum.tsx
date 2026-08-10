"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PlayCircle, Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { VideoPoster } from "@/components/media/video-poster";
import { CURRICULUM } from "@/lib/curriculum";

// One 8-step titanium ramp for the module numbers — polished silver down
// to near-black gunmetal, not a hue at all now (strict monochrome liquid-
// metal palette). Text is a hardcoded opaque near-black/near-white rather
// than var(--ink)/var(--card) — both of those are translucent-glass-ish
// under this theme now and would wash out sitting directly on a solid
// opaque badge fill.
const MODULE_SHADES = [
  { bg: "oklch(0.93 0.003 265)", text: "oklch(0.12 0 0)" },
  { bg: "oklch(0.82 0.004 265)", text: "oklch(0.12 0 0)" },
  { bg: "oklch(0.7 0.004 265)", text: "oklch(0.12 0 0)" },
  { bg: "oklch(0.58 0.005 265)", text: "oklch(0.97 0 0)" },
  { bg: "oklch(0.46 0.005 265)", text: "oklch(0.97 0 0)" },
  { bg: "oklch(0.35 0.005 265)", text: "oklch(0.97 0 0)" },
  { bg: "oklch(0.25 0.005 265)", text: "oklch(0.97 0 0)" },
  { bg: "oklch(0.17 0.005 265)", text: "oklch(0.97 0 0)" },
] as const;

const modules = CURRICULUM;

export function FullCurriculum() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed = modules.map((mod, index) => ({ ...mod, index }));
    if (!q) return indexed;
    return indexed
      .map((mod) => ({
        ...mod,
        lessons: mod.lessons.filter(
          (lesson) =>
            lesson.name.toLowerCase().includes(q) ||
            mod.title.toLowerCase().includes(q)
        ),
      }))
      .filter((mod) => mod.title.toLowerCase().includes(q) || mod.lessons.length > 0);
  }, [query]);

  return (
    <div id="curriculum">
      <h2 className="text-sticker-sm text-2xl font-semibold tracking-tight sm:text-3xl">
        Full curriculum
      </h2>
      <p className="mt-2 text-muted-foreground">
        8 modules, 25 lessons, roughly 4.5 hours of content. Go at your own pace.
      </p>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules or lessons…"
          className="h-10 w-full rounded-full border-2 border-ink bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No modules or lessons match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <Accordion className="mt-6">
          {filtered.map((mod) => {
            const i = mod.index;
            const shade = MODULE_SHADES[i % MODULE_SHADES.length];
            return (
              <AccordionItem key={mod.title} value={`module-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  <span className="flex items-center gap-3">
                    <span
                      className="pill-outline flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: shade.bg, color: shade.text }}
                    >
                      {i + 1}
                    </span>
                    {mod.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                    <VideoThumbnail
                      aspect="video"
                      poster={
                        <VideoPoster variant="muted">
                          <span className="font-heading text-2xl font-semibold">
                            {i + 1}
                          </span>
                        </VideoPoster>
                      }
                      label="Module preview"
                      duration={mod.preview}
                      dialogTitle={`${mod.title} (preview)`}
                      className="w-full shrink-0 border-2 border-ink sm:w-48"
                    />
                    <ul className="flex-1 space-y-2.5">
                      {mod.lessons.map((lesson) => (
                        <li
                          key={lesson.name}
                          className="flex items-center justify-between gap-4 rounded-lg px-2.5 py-2 text-sm hover:bg-secondary/60"
                        >
                          <span className="flex items-center gap-2.5 text-foreground">
                            <PlayCircle className="size-4 shrink-0 text-primary" />
                            {lesson.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
