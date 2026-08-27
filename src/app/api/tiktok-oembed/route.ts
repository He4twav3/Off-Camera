import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side proxy for TikTok's public oEmbed endpoint, used by
 * PlatformEmbed (src/components/media/platform-embed.tsx) to resolve a
 * share link (vt.tiktok.com/...) to real embeddable video markup.
 *
 * This exists specifically to eliminate a real, repeatedly-observed
 * problem: calling tiktok.com/oembed directly from the browser
 * occasionally gets CORS-blocked (looks like basic rate-limiting on
 * near-simultaneous requests), and a browser logs that failure to the
 * console itself, unconditionally, the moment the network layer rejects
 * it — no amount of try/catch in our own JS suppresses that log line,
 * because it happens before our code ever sees the rejection. Calling
 * TikTok from here instead (server-to-server, no CORS involved at all)
 * means the browser only ever talks to our own origin, so that class of
 * console error can't happen regardless of what TikTok's endpoint does
 * on any given request.
 *
 * Cached for an hour (`next.revalidate`) so repeat visits, and multiple
 * visitors loading the same video, don't each trigger a fresh call to
 * TikTok's endpoint — also reduces exactly the kind of request volume
 * that seems to trigger their rate-limiting in the first place.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "oEmbed request failed" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "oEmbed request failed" }, { status: 502 });
  }
}
