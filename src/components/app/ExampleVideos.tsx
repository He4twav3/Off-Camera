import { Globe, Play } from "lucide-react";
import { postIdentity } from "@/lib/post-key";
import { posterFor } from "@/lib/video-poster";
import { PLATFORM_LABELS } from "@/lib/utils";

/**
 * The brand's example links as cards, for the creator: a video from TikTok, Instagram or YouTube shows as a video
 * card (cover and a play mark); any other link shows as a link card with its website. Every card opens in a new tab.
 */
export async function ExampleVideos({ urls }: { urls: string[] }) {
  const items = urls.map((raw) => {
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
  if (items.length === 0) return null;
  const posters = await Promise.all(items.map((i) => (i.platform ? posterFor(i.platform, i.url) : Promise.resolve(null))));

  return (
    <section className="mt-6">
      <h2 className="font-heading text-base font-semibold text-foreground">Examples</h2>
      <p className="mt-0.5 mb-3 text-sm text-muted-foreground">What this campaign is after. Open any to see it.</p>
      <ul className="grid grid-cols-3 gap-2 sm:gap-4">
        {items.map((it, i) => (
          <li key={it.url} className="min-w-0">
            <a href={it.url} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[13rem] overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-muted to-card sm:rounded-xl">
                {posters[i] && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed platform CDN images
                  <img src={posters[i]!} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur sm:size-12">
                    {it.platform ? <Play className="size-4 fill-current sm:size-5" /> : <Globe className="size-4 sm:size-5" />}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-foreground sm:text-sm">
                {it.platform ? (PLATFORM_LABELS[it.platform as keyof typeof PLATFORM_LABELS] ?? it.platform) : it.host}
              </p>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{it.platform ? "Watch example" : "Open link"}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
