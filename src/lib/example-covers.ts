/**
 * Cover images for example videos, kept on our own site (public/examples) because TikTok no longer sends a cover with
 * its embed details. Keyed by the TikTok video id. Each is a still from the video, used only as the card's thumbnail;
 * the video itself plays through TikTok's official embed.
 */
const COVERS: Record<string, string> = {
  "7595217979986529567": "/examples/dawn_flaherty-7595217979986529567.jpg",
  "7618606049490111758": "/examples/sabrina_ramonov-7618606049490111758.jpg",
  "7555584924158479630": "/examples/creators_growth_studio-7555584924158479630.jpg",
  // Instagram reels, keyed by the reel's code.
  DdcVV3zvI6i: "/examples/instagram-DdcVV3zvI6i.jpg",
};

/** Our own cover for an example video link, if we keep one. */
export function storedCover(url: string): string | null {
  const id = /\/video\/(\d+)/.exec(url)?.[1] ?? /instagram\.com\/(?:[^/]+\/)?(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/.exec(url)?.[1];
  return id ? (COVERS[id] ?? null) : null;
}
