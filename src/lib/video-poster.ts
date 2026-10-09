import "server-only";
import { fetchInstagramPoster, fetchTikTokPoster } from "@/lib/proof-thumbnails";

/**
 * A cover image for a creator's post, so a video can be shown as a video card. TikTok and Instagram come from the
 * same cached lookups the landing page uses; YouTube Shorts has a plain public thumbnail. Anything that can't be
 * resolved is null, and the card shows a plain tile instead. Never throws.
 */
export async function posterFor(platform: string, url: string): Promise<string | null> {
  try {
    if (platform === "tiktok") return await fetchTikTokPoster(url);
    if (platform === "instagram") return await fetchInstagramPoster(url);
    if (platform === "youtube_shorts") {
      const u = new URL(url);
      const id = u.pathname.match(/\/shorts\/([\w-]{6,})/)?.[1] ?? u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
      return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
    }
  } catch {
    /* a bad link is just no poster */
  }
  return null;
}
