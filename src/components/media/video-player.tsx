"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const ASPECT_CLASSES = {
  video: "aspect-video",
  portrait: "aspect-9/16",
  square: "aspect-square",
} as const;

export interface VideoPlayerProps {
  /**
   * Real, directly-playable video source (an .mp4/.webm URL — this is also
   * the slot for a Mux/Cloudflare Stream/Bunny progressive URL, anything a
   * plain <video> tag can point at). Takes priority over `youtubeId`.
   */
  src?: string;
  /**
   * Real YouTube video id (the part after `v=`, works for unlisted videos
   * too) — rendered as an actual youtube-nocookie.com embed, not the
   * simulated player. Ignored if `src` is set.
   */
  youtubeId?: string;
  /** Poster/placeholder content shown behind the controls (typically a gradient + icon). */
  poster: ReactNode;
  /** Small pill label shown top-left before playback starts, e.g. "Intro from Aron". */
  label?: string;
  aspect?: keyof typeof ASPECT_CLASSES;
  /** Simulated clip length in seconds, used only when there's no real `src`/`youtubeId`. */
  durationSeconds?: number;
  className?: string;
  autoPlay?: boolean;
}

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  youtubeId,
  poster,
  label,
  aspect = "video",
  durationSeconds = 48,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);

  const hasRealEmbed = Boolean(src || youtubeId);

  // Simulated playback clock — only runs when there's no real video to drive it.
  useEffect(() => {
    if (hasRealEmbed || !playing) return;
    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.25;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(id);
  }, [playing, hasRealEmbed, duration]);

  // Real YouTube embed (works for unlisted videos) — youtube-nocookie.com
  // avoids setting tracking cookies until the visitor actually presses
  // play. This is a genuine embed, not the simulated placeholder below: no
  // youtubeId is configured yet anywhere in this build (see curriculum.ts /
  // site-config.ts), so nothing renders here until a real one is added.
  if (!src && youtubeId) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      ...(autoPlay ? { autoplay: "1", mute: "1" } : {}),
    });
    return (
      <div
        className={cn(
          "card-sticker overflow-hidden rounded-2xl bg-card",
          ASPECT_CLASSES[aspect],
          className
        )}
      >
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`}
          title={label ?? "Course video"}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  function togglePlay() {
    if (src && videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
      return;
    }
    setPlaying((p) => {
      if (!p && elapsed >= duration) setElapsed(0);
      return !p;
    });
  }

  function seek(event: MouseEvent<HTMLDivElement>) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const next = ratio * duration;
    setElapsed(next);
    if (src && videoRef.current) videoRef.current.currentTime = next;
  }

  const progress = duration ? Math.min(1, elapsed / duration) : 0;

  return (
    <div
      className={cn(
        "card-sticker group relative isolate overflow-hidden rounded-2xl bg-card",
        ASPECT_CLASSES[aspect],
        className
      )}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          playsInline
          className="absolute inset-0 size-full object-cover"
          onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <div className="absolute inset-0">{poster}</div>
      )}

      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute inset-0 flex items-center justify-center"
      >
        {!playing && (
          <span className="flex size-16 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-transform group-hover:scale-105">
            <Play className="size-7 translate-x-0.5 fill-current" />
          </span>
        )}
      </button>

      {label && !playing && (
        <div className="absolute top-4 left-4 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {label}
        </div>
      )}

      <div
        data-visible={playing}
        className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-3 opacity-0 transition-opacity group-hover:opacity-100 data-[visible=true]:opacity-100"
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="text-white">
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </button>
        <div
          ref={trackRef}
          onClick={seek}
          className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/25"
        >
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs whitespace-nowrap text-white/90 tabular-nums">
          {formatTime(elapsed)} / {formatTime(duration)}
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="text-white"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}
