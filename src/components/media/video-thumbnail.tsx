"use client";

import type { ReactNode } from "react";
import { Play, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/media/video-player";
import { cn } from "@/lib/utils";

const ASPECT_CLASSES = {
  video: "aspect-video",
  portrait: "aspect-9/16",
  square: "aspect-square",
} as const;

/**
 * A static poster thumbnail that opens a full VideoPlayer in a lightbox on click.
 * Used for content that's secondary to the page (module previews, testimonials)
 * so we're not running several live players on screen at once.
 */
export function VideoThumbnail({
  poster,
  label,
  duration,
  badge,
  dialogTitle,
  aspect = "video",
  className,
  youtubeId,
}: {
  poster: ReactNode;
  label?: string;
  duration?: string;
  /** Small top-right pill, e.g. disclosing AI-generated example content. */
  badge?: string;
  dialogTitle: string;
  aspect?: keyof typeof ASPECT_CLASSES;
  className?: string;
  /** Real YouTube id — see VideoPlayer. Swaps the flat poster for the real thumbnail frame too. */
  youtubeId?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          "group relative isolate w-full overflow-hidden rounded-xl border border-border/70 text-left",
          ASPECT_CLASSES[aspect],
          className
        )}
      >
        <div className="absolute inset-0">
          {youtubeId ? (
            // eslint-disable-next-line @next/next/no-img-element -- external YouTube CDN thumbnail, not a local asset
            <img
              src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            poster
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-transform group-hover:scale-105">
            <Play className="size-4 translate-x-0.5 fill-current" />
          </span>
        </div>
        {label && (
          <div className="absolute top-3 left-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {label}
          </div>
        )}
        {duration && (
          <div className="absolute right-3 bottom-3 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white">
            {duration}
          </div>
        )}
        {badge && (
          <div className="pill-outline absolute top-3 right-3 rounded-full bg-toy-soft px-2.5 py-1 text-[11px] font-semibold text-toy-soft-foreground">
            {badge}
          </div>
        )}
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <div className="relative">
          <VideoPlayer
            poster={poster}
            label={label}
            aspect={aspect}
            youtubeId={youtubeId}
            autoPlay
          />
          {badge && (
            <div className="pill-outline absolute top-3 left-3 rounded-full bg-toy-soft px-2.5 py-1 text-[11px] font-semibold text-toy-soft-foreground">
              {badge}
            </div>
          )}
          <DialogClose
            aria-label="Close video"
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <X className="size-4" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
