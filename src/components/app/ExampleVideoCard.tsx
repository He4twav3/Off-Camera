"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";

/**
 * One example video as a card. A video uploaded to our storage plays in a pop-up in our own player; a TikTok,
 * Instagram or YouTube video opens on the platform in a new tab (their embedded players fail without warning).
 */
export function ExampleVideoCard({
  url,
  platform,
  poster,
  label,
}: {
  url: string;
  platform: string;
  poster: string | null;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [open]);

  const uploaded = platform === "upload";
  // TikTok no longer sends a cover image with its embed details, so a card without one shows the creator's handle.
  const handle = !poster && !uploaded ? (/\/@([^/?#]+)/.exec(url)?.[1] ?? null) : null;

  // A TikTok, Instagram or YouTube example opens on the platform itself, in a new tab. Their players embedded in our
  // page fail without warning ("Player error"), so we never embed them; only our own uploads play here.
  if (!uploaded)
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Watch this example on ${label}`} className="group block w-full">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element -- signed platform CDN images
            <img src={poster} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          )}
          {handle && (
            <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-2 text-center text-xs font-semibold text-foreground sm:text-sm">@{handle}</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur sm:size-12">
              <Play className="size-4 fill-current sm:size-5" />
            </span>
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 truncate text-xs font-medium text-foreground sm:text-sm">
          Watch on {label}
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </p>
      </a>
    );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Play ${label} example`} className="group block w-full cursor-pointer text-left">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
          {uploaded && !poster && (
            // The first frame stands in for a cover. #t nudges Safari to draw it.
            <video src={`${url}#t=0.1`} muted playsInline preload="metadata" aria-hidden className="absolute inset-0 size-full object-cover" />
          )}
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element -- signed platform CDN images
            <img src={poster} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          )}
          {handle && (
            <span className="absolute inset-x-0 bottom-0 truncate px-2 pb-2 text-center text-xs font-semibold text-foreground sm:text-sm">@{handle}</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur sm:size-12">
              <Play className="size-4 fill-current sm:size-5" />
            </span>
          </span>
        </div>
        <p className="mt-1.5 truncate text-xs font-medium text-foreground sm:text-sm">{label}</p>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} example`}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-[22rem] rounded-2xl border border-border bg-background p-3 shadow-2xl sm:p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
            <div className="max-h-[75vh] overflow-y-auto">
              <video src={url} controls autoPlay playsInline className="aspect-[9/16] w-full rounded-lg bg-black object-contain" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
