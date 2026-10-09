/** The video id in a YouTube link (a Short, a watch link or a youtu.be link), or null. Pure, so the server and the browser share it. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.match(/\/shorts\/([\w-]{6,})/)?.[1] ?? u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) || null : null);
  } catch {
    return null;
  }
}
