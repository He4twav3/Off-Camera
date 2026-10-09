import { Play } from "lucide-react";
import { posterFor } from "@/lib/video-poster";
import { PLATFORM_LABELS } from "@/lib/utils";

type Best = { id: string; platform: string; url: string; views: number; creatorName: string; campaignTitle: string };

/**
 * The top videos as video cards: a tall cover with a play mark, the view count over it, and the creator underneath.
 * Three across, small enough for a phone. The whole card opens the video.
 */
export async function BestVideos({ videos }: { videos: Best[] }) {
  if (videos.length === 0) return null;
  const posters = await Promise.all(videos.map((v) => posterFor(v.platform, v.url)));
  return (
    <section>
      <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Best videos</h2>
      <ul className="grid grid-cols-3 gap-2 sm:gap-4">
        {videos.map((v, i) => (
          <li key={v.id} className="min-w-0">
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${v.creatorName}'s video, ${v.views.toLocaleString()} views`}
              className="group block"
            >
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
                {posters[i] && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed platform CDN images, not ours to optimise
                  <img src={posters[i]!} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                )}
                <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:top-2 sm:left-2 sm:text-xs">#{i + 1}</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur sm:size-12">
                    <Play className="size-4 fill-current sm:size-5" />
                  </span>
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 sm:px-3 sm:pb-2.5">
                  <span className="block font-heading text-sm font-semibold tabular-nums text-white sm:text-lg">
                    {compact(v.views)}
                    <span className="ml-1 text-[10px] font-medium text-white/75 sm:text-xs">views</span>
                  </span>
                </span>
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-foreground sm:text-sm">{v.creatorName}</p>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                {PLATFORM_LABELS[v.platform as keyof typeof PLATFORM_LABELS] ?? v.platform} · {v.campaignTitle}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
