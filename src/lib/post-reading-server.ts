import "server-only";
import type { PostIdentity } from "@/lib/post-key";
import {
  parseInstagram,
  parseTikTok,
  parseYouTube,
  type PostReading,
} from "@/lib/post-reading";

/**
 * Reads one post from its platform: YouTube through its own API (YOUTUBE_API_KEY),
 * TikTok and Instagram through Apify (APIFY_TOKEN), the same services the creator's
 * account verification uses. Scraping can fail or return nothing, so this never throws:
 * it says whether the service was unavailable, and the caller keeps the earlier number.
 */

type Ok = Extract<PostIdentity, { ok: true }>;
export type ReadResult =
  | { ok: true; reading: PostReading }
  | { ok: false; error: string; unavailable: boolean };

const UNAVAILABLE = (error: string): ReadResult => ({
  ok: false,
  error,
  unavailable: true,
});

async function apify(
  actor: string,
  payload: unknown,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(50_000),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Record<string, unknown>[];
}

async function youtube(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    ...params,
    key: process.env.YOUTUBE_API_KEY ?? "",
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/${path}?${qs}`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { items?: Record<string, unknown>[] };
}

export async function fetchPostReading(
  post: Pick<Ok, "platform" | "key" | "url">,
): Promise<ReadResult> {
  try {
    if (post.platform === "youtube_shorts") {
      if (!process.env.YOUTUBE_API_KEY)
        return UNAVAILABLE("Automatic checking isn't switched on yet.");
      const id = post.key.split(":")[1];
      const video = (
        await youtube("videos", { part: "snippet,statistics", id })
      ).items?.[0];
      if (!video)
        return {
          ok: false,
          error: "We couldn't find that YouTube video. Is it public?",
          unavailable: false,
        };
      const channelId = String(
        (video.snippet as Record<string, unknown> | undefined)?.channelId ?? "",
      );
      const channel = channelId
        ? (await youtube("channels", { part: "snippet", id: channelId }))
            .items?.[0]
        : undefined;
      const customUrl = (
        channel?.snippet as Record<string, unknown> | undefined
      )?.customUrl;
      return { ok: true, reading: parseYouTube(video, customUrl) };
    }

    if (!process.env.APIFY_TOKEN)
      return UNAVAILABLE("Automatic checking isn't switched on yet.");

    if (post.platform === "tiktok") {
      const item = (
        await apify("clockworks~tiktok-scraper", { postURLs: [post.url] })
      )[0];
      if (!item)
        return {
          ok: false,
          error: "We couldn't find that TikTok video. Is it public?",
          unavailable: false,
        };
      return { ok: true, reading: parseTikTok(item) };
    }

    const item = (
      await apify("apify~instagram-scraper", {
        directUrls: [post.url],
        resultsType: "posts",
        resultsLimit: 1,
      })
    )[0];
    if (!item)
      return {
        ok: false,
        error: "We couldn't find that Instagram post. Is the account public?",
        unavailable: false,
      };
    return { ok: true, reading: parseInstagram(item) };
  } catch (err) {
    console.error(
      "fetchPostReading failed:",
      post.platform,
      (err as Error).message,
    );
    return UNAVAILABLE(
      "We couldn't check this post just now. We'll try again.",
    );
  }
}
