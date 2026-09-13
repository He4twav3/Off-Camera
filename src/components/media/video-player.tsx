"use client";

import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * iOS Safari has no standard Fullscreen API for arbitrary elements — only
 * the video element itself, and only through this webkit-prefixed method
 * (not in the DOM lib types, hence the cast at the call site). Every other
 * engine gets the standard `requestFullscreen`.
 */
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

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
   * too) — rendered as an actual youtube-nocookie.com embed.
   */
  youtubeId?: string;
  /**
   * Placeholder content for when there's neither a real `src` nor a
   * `youtubeId` yet — an honest "nothing here" state (see the component's
   * own note on why that beats a real-looking player holding nothing).
   * Unused once a real `src` is playing; that's what `posterImage` is for.
   */
  poster: ReactNode;
  /**
   * A real image shown in place of the video before playback starts —
   * the native `<video poster>`, so the browser handles showing and
   * hiding it with no extra state. Only meaningful alongside `src`; the
   * `poster` ReactNode above is what renders when there's no real video
   * at all.
   */
  posterImage?: string;
  /** Small pill label shown top-left before playback starts, e.g. "Intro from Aron". */
  label?: string;
  aspect?: keyof typeof ASPECT_CLASSES;
  className?: string;
  autoPlay?: boolean;
  /**
   * Which visual language frames the video.
   *
   * "sticker" — the ink-outline + hard offset shadow used across the
   * app/checkout/dashboard UI. Still the default, so nothing outside the
   * marketing pages changes.
   *
   * "premium" — the landing page's hairline + soft-depth frame. The two
   * systems genuinely can't be reconciled into one (a hard cartoon
   * offset and a soft cinematic shadow are opposite claims about what
   * kind of object this is), so the caller picks, rather than this
   * component guessing from context.
   *
   * Corner radius lives here too, per frame, rather than as one radius
   * hardcoded for both: "premium" is only ever real video content (an
   * actual clip or a real platform embed), and real video — Instagram's
   * own embeds included — reads as only slightly rounded, not the heavy
   * rounding a sticker card wants. "sticker" keeps its original radius so
   * app/checkout/dashboard, which never asked for this, don't change.
   */
  frame?: "sticker" | "premium";
}

const FRAME_CLASSES = {
  sticker: "card-sticker bg-card rounded-2xl",
  premium:
    "rounded-sm border border-hairline bg-surface-2 shadow-[0_22px_48px_-24px_oklch(0_0_0_/_0.85)]",
} as const;

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
  posterImage,
  label,
  aspect = "video",
  className,
  autoPlay = false,
  frame = "sticker",
}: VideoPlayerProps) {
  const frameClass = FRAME_CLASSES[frame];
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  // Whether the bottom bar (scrubber/mute/fullscreen) is showing. Only
  // matters while playing — while paused the bar stays hidden regardless
  // (see its data-visible below), the big centre play button is the only
  // control needed there. While playing, this is what lets the bar fade
  // out on its own instead of sitting on screen for the whole video: see
  // `revealControls` below.
  const [controlsVisible, setControlsVisible] = useState(true);

  // Hooks must run unconditionally, ahead of the two early returns below
  // (youtubeId embed / no-src placeholder) — this just clears any pending
  // auto-hide timeout on unmount, so it's a no-op for both of those.
  useEffect(() => clearHideTimer, []);

  // Real YouTube embed (works for unlisted videos) — youtube-nocookie.com
  // avoids setting tracking cookies until the visitor actually presses
  // play.
  if (!src && youtubeId) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      ...(autoPlay ? { autoplay: "1", mute: "1" } : {}),
    });
    return (
      <div
        className={cn(
          "overflow-hidden",
          frameClass,
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

  // No real src or youtubeId: an honest static poster, not a player. This
  // used to run a fake progress clock behind a working-looking play
  // button — a poster that visibly "played" nothing was exactly the kind
  // of not-quite-real UI this whole rebuild has been removing elsewhere
  // (fake ratings, fake testimonials, fake founding date). A real button
  // that does nothing is worse than no button.
  if (!src) {
    return (
      <div
        className={cn(
          "relative isolate overflow-hidden",
          frameClass,
          ASPECT_CLASSES[aspect],
          className
        )}
      >
        <div className="absolute inset-0">{poster}</div>
        {label && (
          <div className="absolute top-4 left-4 rounded-full bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {label}
          </div>
        )}
      </div>
    );
  }

  function togglePlay() {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
    }
  }

  function seek(event: MouseEvent<HTMLDivElement>) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const next = ratio * duration;
    setElapsed(next);
    if (videoRef.current) videoRef.current.currentTime = next;
  }

  function clearHideTimer() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }

  // Shows the bar, then queues it to fade back out — called on play, and
  // every time the video area is tapped while playing. Each call bumps
  // the timer, so the bar stays up as long as someone keeps interacting.
  function revealControls() {
    setControlsVisible(true);
    clearHideTimer();
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
  }

  // Tapping the video itself is "play", or, once playing, "toggle the
  // bar" — never "pause". Pausing now only happens through the small
  // button inside the bar, so dismissing the bar and stopping playback
  // are two different gestures instead of one tap doing both.
  function handleOverlayTap() {
    if (!playing) {
      videoRef.current?.play();
      return;
    }
    if (controlsVisible) {
      clearHideTimer();
      setControlsVisible(false);
    } else {
      revealControls();
    }
  }

  function enterFullscreen(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    if (video.webkitEnterFullscreen) {
      // iOS Safari: the only fullscreen entry point <video> has there.
      video.webkitEnterFullscreen();
    } else if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    }
  }

  const progress = duration ? Math.min(1, elapsed / duration) : 0;
  const barVisible = playing && controlsVisible;

  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden",
        frameClass,
        ASPECT_CLASSES[aspect],
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={posterImage}
        muted={muted}
        playsInline
        className="absolute inset-0 size-full object-cover"
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => {
          setPlaying(true);
          revealControls();
        }}
        onPause={() => {
          setPlaying(false);
          clearHideTimer();
        }}
      />

      <button
        type="button"
        onClick={handleOverlayTap}
        aria-label={playing ? "Toggle controls" : "Play video"}
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
        data-visible={barVisible}
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
        {/* Manual expand — iOS gets no automatic fullscreen from
            `playsInline` (the whole point of that attribute), so this is
            the only way to reach full-screen playback on iPhone. */}
        <button
          type="button"
          onClick={enterFullscreen}
          aria-label="Fullscreen"
          className="text-white"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
