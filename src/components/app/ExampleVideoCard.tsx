"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { PlatformEmbed } from "@/components/media/platform-embed";
import { youtubeId } from "@/lib/youtube";

/**
 * One example video as a card; clicking it plays the video in a pop-up on our page (TikTok and Instagram through
 * their own embed, YouTube through its player). The pop-up always carries a link to open it on the platform, in
 * case an embed is blocked.
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

  const yt = platform === "youtube_shorts" ? youtubeId(url) : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Play ${label} example`} className="group block w-full cursor-pointer text-left">
        <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element -- signed platform CDN images
            <img src={poster} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
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
              {yt ? (
                <div className="aspect-[9/16] w-full overflow-hidden rounded-lg bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
                    title={`${label} example`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="size-full"
                  />
                </div>
              ) : (
                <PlatformEmbed postUrl={url} />
              )}
            </div>
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-2">
              <ExternalLink className="size-3.5" />
              Open on {label}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
