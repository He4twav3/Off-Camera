"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Smartphone,
  Handshake,
  Briefcase,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { VideoPoster } from "@/components/media/video-poster";

const modules = [
  {
    icon: Compass,
    title: "Find your niche without showing your face",
    description:
      "Pick an angle that plays to your strengths, even if you never want to be on camera.",
    duration: "6 min",
  },
  {
    icon: Sparkles,
    title: "The anatomy of a scroll-stopping hook",
    description:
      "The 3-second formulas that stop the scroll and keep people watching to the end.",
    duration: "14 min",
  },
  {
    icon: Smartphone,
    title: "Film & edit with just your phone",
    description:
      "A repeatable, no-gear workflow for shooting and editing content brands actually want.",
    duration: "18 min",
  },
  {
    icon: Handshake,
    title: "Pitch brands and land your first deal",
    description:
      "Outreach templates and pitch structures that get replies, not silence.",
    duration: "11 min",
  },
  {
    icon: Briefcase,
    title: "Get picked for campaigns",
    description:
      "How agencies and platforms choose creators, and how to show up on their radar.",
    duration: "9 min",
  },
  {
    icon: DollarSign,
    title: "Pricing, contracts & getting paid",
    description:
      "What to charge, what to put in writing, and how to avoid working for exposure.",
    duration: "10 min",
  },
];

const CARD_WIDTH = 300;
const CARD_GAP = 20;

export function CurriculumShelf() {
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

  const maxIndex = modules.length - 1;

  return (
    <section id="curriculum" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Eight modules that take you from your first faceless post to a
            steady stream of brand campaigns. Click any preview to watch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {index + 1} / {modules.length}
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
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
      >
        {modules.map((mod) => (
          <Card
            key={mod.title}
            className="card-sticker shrink-0 snap-start gap-4 rounded-2xl bg-card py-4"
            style={{ width: CARD_WIDTH }}
          >
            <CardContent>
              <VideoThumbnail
                aspect="video"
                poster={
                  <VideoPoster variant="muted">
                    <mod.icon className="size-8" />
                  </VideoPoster>
                }
                duration={mod.duration}
                dialogTitle={mod.title}
                className="border-2 border-ink"
              />
              <h3 className="mt-4 text-base leading-snug font-semibold">
                {mod.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {mod.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" nativeButton={false} render={<Link href="/course" />}>
          See the full curriculum
        </Button>
      </div>
    </section>
  );
}
