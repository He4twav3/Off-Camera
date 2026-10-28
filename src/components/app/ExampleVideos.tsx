import { Globe, Play } from "lucide-react";
import { ExampleVideoCard } from "@/components/app/ExampleVideoCard";
import { postIdentity } from "@/lib/post-key";
import { posterFor } from "@/lib/video-poster";
import { storedCover } from "@/lib/example-covers";
import { lastingCover, uploadedPoster } from "@/lib/example-cover-store";
import { PLATFORM_LABELS } from "@/lib/utils";
import { isUploadedExample } from "@/lib/example-videos";
import { MAX_EXAMPLES } from "@/lib/campaign-brief";

/**
 * The brand's example links as cards, for the creator: a video uploaded to our storage, or one from TikTok, Instagram
 * or YouTube, shows as a video card (cover and a play mark) that plays in a pop-up; any other link shows as a link
 * card with its website and opens in a new tab.
 */
export async function ExampleVideos({ urls, emptyHref }: { urls: string[]; emptyHref?: string }) {
  const items = urls.map((raw) => {
    if (isUploadedExample(raw)) return { url: raw, platform: "upload" as string, host: null as string | null };
    const id = postIdentity(raw);
    if (id.ok) return { url: id.url, platform: id.platform as string, host: null as string | null };
    let host = raw;
    try {
      host = new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      /* shown as typed */
    }
    return { url: raw, platform: null, host };
  });
  // The brand's own view shows two empty "Add a video" boxes that open Edit, so it's clear videos can go there
  // (fewer once the examples are nearly full). Creators never see them.
  const empties = emptyHref ? Math.min(2, Math.max(0, MAX_EXAMPLES - items.length)) : 0;
  if (items.length === 0 && empties === 0) return null;
  // A thumbnail we keep ourselves wherever we can, so it never expires into a blank card (lib/example-cover-store.ts).
  const posters = await Promise.all(
    items.map(async (i) => {
      const kept = storedCover(i.url);
      if (kept || !i.platform) return kept;
      if (i.platform === "upload") return uploadedPoster(i.url);
      if (i.platform === "tiktok" || i.platform === "instagram") return (await lastingCover(i.platform, i.url)) ?? posterFor(i.platform, i.url);
      return posterFor(i.platform, i.url);
    }),
  );

  return (
    <section className="mt-6">
      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Examples</h2>
      <ul className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {items.map((it, i) => (
          <li key={it.url} className="w-[calc(50%-0.375rem)] min-w-0 sm:w-[calc(33.333%-0.667rem)]">
            {it.platform ? (
              <ExampleVideoCard
                url={it.url}
                platform={it.platform}
                poster={posters[i]}
                label={it.platform === "upload" ? "Video" : (PLATFORM_LABELS[it.platform as keyof typeof PLATFORM_LABELS] ?? it.platform)}
              />
            ) : (
              <a href={it.url} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur sm:size-12">
                      <Globe className="size-4 sm:size-5" />
                    </span>
                  </span>
                </div>
                <p className="mt-1.5 truncate text-xs font-medium text-foreground sm:text-sm">{it.host}</p>
              </a>
            )}
          </li>
        ))}
        {Array.from({ length: empties }, (_, k) => (
          <li key={`empty-${k}`} className="w-[calc(50%-0.375rem)] min-w-0 sm:w-[calc(33.333%-0.667rem)]">
            <a href={emptyHref} aria-label="Add an example video" className="group block">
              <div className="mx-auto flex aspect-[9/16] w-full max-w-[13rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 transition-colors group-hover:border-primary/50 sm:rounded-xl">
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground sm:size-12">
                  <Play className="size-4 fill-current sm:size-5" />
                </span>
                <span className="px-3 text-center text-xs font-semibold text-muted-foreground group-hover:text-primary">Add a video</span>
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-muted-foreground sm:text-sm">Example</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
