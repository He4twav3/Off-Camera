"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { VideoPoster } from "@/components/media/video-poster";
import { CURRICULUM, MODULE_SHADES } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

const AUTOPLAY_INTERVAL_MS = 2400;

/**
 * Horizontal accordion of the 8 modules — one panel open at a time,
 * color-ramped left-to-right by MODULE_SHADES so the eye reads course
 * progression without needing to read every number. Autoplays through
 * once on load, then hands control to the visitor: clicking any collapsed
 * panel (or tabbing to it and pressing Enter/Space, since these are plain
 * <button>s) stops the autoplay and focuses that module instead.
 *
 * Only shown at lg+ — 8 panels, even collapsed, don't have room to also
 * hold an expanded one on a phone-width screen. Below lg, ModuleShelfMobile
 * below renders the same 8 modules as a horizontal-scroll-snap card row
 * instead, which is the pattern this component used sitewide before this
 * accordion existed and still holds up fine at that width.
 */
function ModuleAccordion() {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % CURRICULUM.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoplay]);

  function focus(i: number) {
    setAutoplay(false);
    setActive(i);
  }

  return (
    <div className="card-sticker mt-10 hidden h-[440px] overflow-hidden rounded-3xl lg:flex">
      {CURRICULUM.map((mod, i) => {
        const shade = MODULE_SHADES[i];
        const isActive = i === active;
        // The active panel renders its VideoThumbnail, which is itself a
        // <button> (opens a lightbox) -- a <button> can't validly contain
        // another <button> (invalid HTML, and React correctly flags it as
        // a hydration mismatch), so only *collapsed* panels are real
        // buttons. The active one doesn't need to be one anyway: it's
        // already focused/open, its own content (the thumbnail) is the
        // interactive element now.
        const Wrapper = isActive ? "div" : "button";
        return (
          <Wrapper
            key={mod.id}
            {...(!isActive && {
              type: "button" as const,
              onClick: () => focus(i),
              "aria-label": mod.title,
            })}
            className={cn(
              "group relative flex shrink-0 flex-col overflow-hidden text-left transition-[flex-grow] duration-500 ease-out",
              !isActive && "cursor-pointer"
            )}
            style={{
              flexGrow: isActive ? 12 : 1,
              flexBasis: 0,
              backgroundColor: shade.bg,
              color: shade.text,
            }}
          >
            {/* Collapsed label — rotated to run bottom-to-top, matches the
                strip's own narrow width. Crossfades out (not rotates) as
                its panel opens, into the horizontal heading below. */}
            <span
              className={cn(
                "absolute top-8 left-1/2 origin-center -translate-x-1/2 [writing-mode:vertical-rl] text-sm font-semibold whitespace-nowrap transition-opacity duration-200",
                isActive ? "opacity-0" : "opacity-90 group-hover:opacity-100"
              )}
            >
              {mod.title.replace(/^Module \d+: /, "")}
            </span>

            {/* Open content */}
            <div
              className={cn(
                "flex h-full min-w-[20rem] flex-col justify-between p-6 transition-opacity duration-300 sm:p-8",
                isActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
              )}
            >
              <div>
                <h3 className="font-heading text-xl font-semibold text-balance sm:text-2xl">
                  {mod.title.replace(/^Module \d+: /, "")}
                </h3>
                <p className="mt-3 max-w-sm text-sm opacity-80 sm:text-base">
                  {mod.description}
                </p>
              </div>

              {/* Only mounted once active, not just visually hidden the rest
                  of the time: VideoThumbnail renders its own <button>
                  (opens a lightbox), and every *collapsed* panel here is
                  itself a <button> -- mounting this unconditionally would
                  put a real <button> inside a <button> on the 7 inactive
                  panels too, invalid HTML regardless of opacity. */}
              {isActive && (
                <div className="w-full max-w-56">
                  <VideoThumbnail
                    aspect="video"
                    poster={
                      <VideoPoster variant="muted">
                        <span className="font-heading text-2xl font-semibold">{i + 1}</span>
                      </VideoPoster>
                    }
                    duration={mod.preview}
                    dialogTitle={mod.title}
                    youtubeId={mod.youtubeId}
                    className="border-2 border-ink"
                  />
                </div>
              )}
            </div>

            {/* Numeral, bottom, always present — the ramp's own index. */}
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 font-heading text-2xl font-bold opacity-60 tabular-nums">
              {i + 1}
            </span>
          </Wrapper>
        );
      })}
    </div>
  );
}

const CARD_WIDTH = 300;
const CARD_GAP = 20;

/** Below lg: the horizontal-scroll-snap card row this section used
 * sitewide before the accordion above existed. Same 8 modules, same
 * descriptions — just a layout that still works at phone width. */
function ModuleShelfMobile() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollByCards(delta: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: delta * (CARD_WIDTH + CARD_GAP), behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / (CARD_WIDTH + CARD_GAP)));
  }

  const maxIndex = CURRICULUM.length - 1;

  return (
    <div className="mt-8 lg:hidden">
      <div className="flex items-center justify-end gap-3">
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {index + 1} / {CURRICULUM.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            disabled={index === 0}
            aria-label="Previous module"
            className="pill-outline flex size-9 items-center justify-center rounded-full bg-card transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            disabled={index >= maxIndex}
            aria-label="Next module"
            className="pill-outline flex size-9 items-center justify-center rounded-full bg-card transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
      >
        {CURRICULUM.map((mod, i) => {
          const shade = MODULE_SHADES[i];
          return (
            <div
              key={mod.id}
              className="card-sticker shrink-0 snap-start rounded-2xl p-4"
              style={{ width: CARD_WIDTH, backgroundColor: shade.bg, color: shade.text }}
            >
              <VideoThumbnail
                aspect="video"
                poster={
                  <VideoPoster variant="muted">
                    <span className="font-heading text-2xl font-semibold">{i + 1}</span>
                  </VideoPoster>
                }
                duration={mod.preview}
                dialogTitle={mod.title}
                youtubeId={mod.youtubeId}
                className="border-2 border-ink"
              />
              <h3 className="mt-4 text-base leading-snug font-semibold">
                {mod.title.replace(/^Module \d+: /, "")}
              </h3>
              <p className="mt-1.5 text-sm opacity-80">{mod.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CurriculumShelf() {
  return (
    <section id="curriculum" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="mt-4 text-muted-foreground">
          Eight modules that take you from your first faceless post to a
          steady stream of brand campaigns. Click any panel to jump to it.
        </p>
      </div>

      <ModuleAccordion />
      <ModuleShelfMobile />

      <div className="mt-6 text-center">
        <Button variant="outline" nativeButton={false} render={<Link href="/course" />}>
          See the full curriculum
        </Button>
      </div>
    </section>
  );
}
