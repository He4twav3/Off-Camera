/**
 * Checks that a submitted link is a real post on the platform a campaign is
 * for: https, the right site, and a post (not a profile or the home page).
 * It can't see whether the post exists or is public; view counting does that
 * later. Used by the submit form (hint) and the server action (enforcement).
 */
export type PostPlatform = "tiktok" | "instagram" | "youtube_shorts" | "x";

export const PLATFORM_NAMES: Record<PostPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube",
  x: "X",
};

/** What a good link looks like, shown as the placeholder. */
export const POST_LINK_EXAMPLES: Record<PostPlatform, string> = {
  tiktok: "https://www.tiktok.com/@you/video/1234567890",
  instagram: "https://www.instagram.com/reel/AbC123xyz/",
  youtube_shorts: "https://www.youtube.com/shorts/AbC123xyz",
  x: "https://x.com/you/status/1234567890",
};

const BASE_HOSTS: Record<PostPlatform, string[]> = {
  tiktok: ["tiktok.com"],
  instagram: ["instagram.com", "instagr.am"],
  youtube_shorts: ["youtube.com", "youtu.be"],
  x: ["x.com", "twitter.com"],
};

function onHost(host: string, bases: string[]): boolean {
  return bases.some((b) => host === b || host.endsWith(`.${b}`));
}

function isPostPath(platform: PostPlatform, url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const path = url.pathname;
  switch (platform) {
    case "tiktok":
      // Short share links (vm./vt.tiktok.com/CODE) or the full post path.
      if (/^(vm|vt)\.tiktok\.com$/.test(host)) return path.length > 1;
      return /^\/@[^/]+\/(video|photo)\/\d+/.test(path) || /^\/t\/[\w-]+/.test(path);
    case "instagram":
      return /^\/(?:[^/]+\/)?(p|reel|reels|tv)\/[\w-]+/.test(path);
    case "youtube_shorts":
      if (host === "youtu.be") return /^\/[\w-]{6,}/.test(path);
      return /^\/shorts\/[\w-]{6,}/.test(path) || (path === "/watch" && /^[\w-]{6,}$/.test(url.searchParams.get("v") ?? ""));
    case "x":
      return /^\/[^/]+\/status\/\d+/.test(path);
  }
}

export type PostLinkResult = { ok: true; url: string } | { ok: false; error: string };

export function checkPostLink(raw: string, platform: PostPlatform): PostLinkResult {
  const name = PLATFORM_NAMES[platform];
  const text = raw.trim();
  if (!text) return { ok: false, error: `Paste the link to your ${name} post.` };

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That doesn't look like a link. Paste the full link, starting with https://" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "The link must start with https://" };
  }
  if (!onHost(url.hostname.toLowerCase(), BASE_HOSTS[platform])) {
    return { ok: false, error: `This campaign is for ${name}. Paste the link to your ${name} post.` };
  }
  if (!isPostPath(platform, url)) {
    return {
      ok: false,
      error: `That looks like a ${name} page, not a post. Open the post itself and copy its link, like ${POST_LINK_EXAMPLES[platform]}`,
    };
  }
  return { ok: true, url: url.toString() };
}
