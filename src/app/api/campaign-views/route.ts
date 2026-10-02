import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformEnum } from "@/lib/database.types";

/**
 * Receives view counts from the view-tracking Zap (v3.0) and upserts them
 * into `campaign_views`. Authenticated with a shared secret in the
 * `x-campaign-secret` header (CAMPAIGN_VIEWS_SECRET) — there's no user
 * session on a Zapier request, so this is the only gate; without the env
 * var set the route refuses everything.
 *
 * Body (JSON), matching the keys the Zap already has:
 *   { campaign, instagram_handle, tiktok_handle, youtube_handle,
 *     instagram_views, tiktok_views, youtube_views }
 * A platform is only written when its handle is non-empty and its views is
 * a finite number >= 0.
 */
const PLATFORMS: { handle: string; views: string; platform: PlatformEnum }[] = [
  { handle: "instagram_handle", views: "instagram_views", platform: "instagram" },
  { handle: "tiktok_handle", views: "tiktok_views", platform: "tiktok" },
  { handle: "youtube_handle", views: "youtube_views", platform: "youtube_shorts" },
];

function secretMatches(provided: string | null, expected: string) {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expected = process.env.CAMPAIGN_VIEWS_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-campaign-secret"), expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const campaign = String(body.campaign ?? "").trim().slice(0, 100);
  const now = new Date().toISOString();

  const rows = PLATFORMS.flatMap(({ handle, views, platform }) => {
    const h = String(body[handle] ?? "").trim().replace(/^@+/, "").toLowerCase();
    const v = Number(body[views]);
    if (!h || !Number.isFinite(v) || v < 0) return [];
    return [{ campaign, platform, handle: h, views: Math.floor(v), updated_at: now }];
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "Nothing to record" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("campaign_views")
    .upsert(rows, { onConflict: "campaign,platform,handle" });
  if (error) {
    console.error("campaign_views upsert failed:", error.message);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ saved: rows.length });
}
