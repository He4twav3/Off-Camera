/**
 * A post's identity, from its link: which platform, and the post's own id on it.
 * The same video can be linked many ways (tracking parameters, with or without www,
 * a username in the path), so a submitted post is stored under this key, and one key
 * can only be used once on the whole platform.
 *
 * Pure (no server imports). Short share links (vm.tiktok.com/xyz, and similar) hide
 * the real post id, so they are refused and the creator is asked for the full link.
 */

export type TrackedPlatform = "tiktok" | "instagram" | "youtube_shorts";

export type PostIdentity =
  | { ok: true; platform: TrackedPlatform; key: string; url: string }
  | { ok: false; error: string };

const NAMES: Record<TrackedPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube_shorts: "YouTube",
};

const onHost = (host: string, bases: string[]) =>
  bases.some((b) => host === b || host.endsWith(`.${b}`));

export function postIdentity(raw: string): PostIdentity {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return {
      ok: false,
      error:
        "That doesn't look like a link. Paste the full link, starting with https://",
    };
  }
  if (url.protocol !== "https:")
    return { ok: false, error: "The link must start with https://" };
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  if (onHost(host, ["tiktok.com"])) {
    if (/^(vm|vt)\.tiktok\.com$/.test(host) || /^\/t\//.test(path)) {
      return {
        ok: false,
        error:
          "That's a short TikTok link. Open the video in a browser and copy the full address from the top.",
      };
    }
    const m = path.match(/^\/@([^/]+)\/(?:video|photo)\/(\d{6,25})/);
    if (m)
      return {
        ok: true,
        platform: "tiktok",
        key: `tiktok:${m[2]}`,
        url: `https://www.tiktok.com/@${m[1]}/video/${m[2]}`,
      };
  }

  if (onHost(host, ["instagram.com", "instagr.am"])) {
    const m = path.match(/^\/(?:[^/]+\/)?(p|reel|reels|tv)\/([\w-]{5,})/);
    if (m)
      return {
        ok: true,
        platform: "instagram",
        key: `instagram:${m[2]}`,
        url: `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/`,
      };
  }

  if (onHost(host, ["youtube.com", "youtu.be"])) {
    let id: string | null = null;
    if (host === "youtu.be")
      id = path.match(/^\/([\w-]{11})(?:$|[/?])/)?.[1] ?? null;
    else if (/^\/shorts\/[\w-]{11}/.test(path))
      id = path.match(/^\/shorts\/([\w-]{11})/)![1];
    else if (path === "/watch")
      id = (url.searchParams.get("v") ?? "").match(/^[\w-]{11}$/)?.[0] ?? null;
    if (id)
      return {
        ok: true,
        platform: "youtube_shorts",
        key: `youtube_shorts:${id}`,
        url: `https://www.youtube.com/shorts/${id}`,
      };
  }

  return {
    ok: false,
    error: `That isn't a link to a TikTok, Instagram or YouTube post. Open the post itself and copy its full link.`,
  };
}

export function platformName(p: TrackedPlatform): string {
  return NAMES[p];
}
