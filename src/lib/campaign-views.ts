import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignHashtag } from "@/app/campaign/hashtag";
import type { Database, PlatformEnum } from "@/lib/database.types";

/**
 * View counting for approved campaign signups.
 *
 * Per platform: if the creator pasted post links for it, count exactly those
 * posts; otherwise find their recent posts and count the ones carrying the
 * campaign hashtag (#TechProductLaunch, see app/campaign/hashtag.ts).
 *
 *   YouTube          — YouTube Data API v3 (YOUTUBE_API_KEY)
 *   TikTok/Instagram — Apify actors (APIFY_TOKEN); scraping, so it can fail or
 *                      return nothing — failures are collected, never thrown.
 */

type Signup = Database["public"]["Tables"]["campaign_signups"]["Row"];
type Counts = Record<"instagram" | "tiktok" | "youtube", number>;

const YT_KEY = () => process.env.YOUTUBE_API_KEY ?? "";
const APIFY_TOKEN = () => process.env.APIFY_TOKEN ?? "";

const clean = (h: string) => h.trim().replace(/^@+/, "");

function host(url: string) {
  const m = url.match(/^https?:\/\/(?:www\.|m\.|vm\.|vt\.)?([^/]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function hasTag(tag: string, text: string) {
  return !!tag && text.toLowerCase().replace(/\s+/g, "").includes(tag);
}

function ytId(url: string) {
  return url.match(/(?:v=|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;
}

async function ytGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, key: YT_KEY() });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apify(actor: string, payload: unknown) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(50_000),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export async function countViews(s: Signup) {
  const tag = campaignHashtag(s.campaign).toLowerCase();
  const links = s.post_links.split(/\s+/).filter(Boolean);
  const ytLinks = links.filter((l) => ["youtube.com", "youtu.be"].includes(host(l)));
  const ttLinks = links.filter((l) => host(l) === "tiktok.com");
  const igLinks = links.filter((l) => host(l) === "instagram.com");
  const ig = clean(s.instagram_handle);
  const tt = clean(s.tiktok_handle);
  const yt = clean(s.youtube_handle);

  const counts: Counts = { instagram: 0, tiktok: 0, youtube: 0 };
  const errors: string[] = [];

  // YouTube
  if (YT_KEY() && (ytLinks.length || (yt && tag))) {
    try {
      let ids: string[] = [];
      if (ytLinks.length) {
        ids = ytLinks.map(ytId).filter((x): x is string => !!x);
      } else {
        const ch = await ytGet("channels", { part: "contentDetails", forHandle: `@${yt}` });
        const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (uploads) {
          const pl = await ytGet("playlistItems", {
            part: "snippet",
            playlistId: uploads,
            maxResults: "50",
          });
          ids = (pl.items ?? [])
            .filter((v: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
              hasTag(tag, `${v.snippet?.title ?? ""}${v.snippet?.description ?? ""}`),
            )
            .map((v: any) => v.snippet.resourceId.videoId); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
      }
      if (ids.length) {
        const vids = await ytGet("videos", { part: "statistics", id: ids.slice(0, 50).join(",") });
        counts.youtube = sum((vids.items ?? []).map((i: any) => Number(i.statistics?.viewCount ?? 0))); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    } catch (e) {
      errors.push(`youtube: ${(e as Error).message}`);
    }
  }

  if (APIFY_TOKEN()) {
    // TikTok
    try {
      if (ttLinks.length) {
        const items = await apify("clockworks~tiktok-scraper", { postURLs: ttLinks });
        counts.tiktok = sum(items.map((i) => Number(i.playCount ?? 0)));
      } else if (tt && tag) {
        const items = await apify("clockworks~tiktok-scraper", { profiles: [tt], resultsPerPage: 30 });
        counts.tiktok = sum(
          items
            .filter((i) =>
              hasTag(tag, `${i.text ?? ""} ${(i.hashtags ?? []).map((h: any) => `#${h.name}`).join(" ")}`), // eslint-disable-line @typescript-eslint/no-explicit-any
            )
            .map((i) => Number(i.playCount ?? 0)),
        );
      }
    } catch (e) {
      errors.push(`tiktok: ${(e as Error).message}`);
    }

    // Instagram
    try {
      const views = (i: Record<string, any>) => Number(i.videoPlayCount ?? i.videoViewCount ?? 0); // eslint-disable-line @typescript-eslint/no-explicit-any
      if (igLinks.length) {
        const items = await apify("apify~instagram-scraper", {
          directUrls: igLinks,
          resultsType: "posts",
          resultsLimit: igLinks.length,
        });
        counts.instagram = sum(items.map(views));
      } else if (ig && tag) {
        const items = await apify("apify~instagram-scraper", {
          directUrls: [`https://www.instagram.com/${ig}/`],
          resultsType: "posts",
          resultsLimit: 30,
        });
        counts.instagram = sum(
          items
            .filter((i) =>
              hasTag(tag, `${i.caption ?? ""} ${(i.hashtags ?? []).map((h: string) => `#${h}`).join(" ")}`),
            )
            .map(views),
        );
      }
    } catch (e) {
      errors.push(`instagram: ${(e as Error).message}`);
    }
  }

  return { counts, errors };
}

/**
 * Counts one signup's views and writes them to `campaign_views`, recording the
 * outcome on the signup row. Uses the service-role client — callers must have
 * already checked that the request is from an admin or the cron job.
 */
export async function refreshSignupViews(signupId: string) {
  const db = createAdminClient();
  const { data: signup } = await db
    .from("campaign_signups")
    .select("*")
    .eq("id", signupId)
    .single();
  if (!signup) return { ok: false as const, error: "Signup not found." };

  const { counts, errors } = await countViews(signup);

  const platforms: [PlatformEnum, string, number][] = [
    ["instagram", clean(signup.instagram_handle), counts.instagram],
    ["tiktok", clean(signup.tiktok_handle), counts.tiktok],
    ["youtube_shorts", clean(signup.youtube_handle), counts.youtube],
  ];
  const now = new Date().toISOString();
  const rows = platforms
    .filter(([, handle]) => handle)
    .map(([platform, handle, views]) => ({
      campaign: signup.campaign,
      platform,
      handle: handle.toLowerCase(),
      views,
      updated_at: now,
    }));

  if (rows.length) {
    const { error } = await db
      .from("campaign_views")
      .upsert(rows, { onConflict: "campaign,platform,handle" });
    if (error) errors.push(`save: ${error.message}`);
  }

  await db
    .from("campaign_signups")
    .update({ last_counted_at: now, count_error: errors.join("; ") || null })
    .eq("id", signupId);

  return { ok: errors.length === 0, error: errors.join("; ") || undefined };
}

const PLATFORM_FOR_HOST: Record<string, PlatformEnum> = {
  "instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "youtube.com": "youtube_shorts",
  "youtu.be": "youtube_shorts",
};

/** Which platform a post URL belongs to, or null if it isn't one we count. */
export function platformForUrl(url: string): PlatformEnum | null {
  return PLATFORM_FOR_HOST[host(url)] ?? null;
}

/**
 * Counts the views on the post a creator submitted as proof for an assigned
 * campaign and stores them in `campaign_views` under the job's title and the
 * creator's handle on that platform — which is where the brand dashboard and
 * the creator's own view totals read from. A failed count never overwrites an
 * earlier number with zero.
 */
export async function refreshAssignmentViews(assignmentId: string) {
  const db = createAdminClient();
  const { data: assignment } = await db
    .from("assignments")
    .select("id, job_id, applicant_id, proof_url")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment?.proof_url) return { ok: false as const, error: "No post to count." };

  const platform = platformForUrl(assignment.proof_url);
  if (!platform) return { ok: false as const, error: "Unsupported post link." };

  const [{ data: job }, { data: applicant }, { data: handles }] = await Promise.all([
    db.from("jobs").select("title").eq("id", assignment.job_id).single(),
    db.from("applicants").select("handle").eq("id", assignment.applicant_id).single(),
    db
      .from("applicant_handles")
      .select("handle, is_primary")
      .eq("applicant_id", assignment.applicant_id)
      .eq("platform", platform)
      .order("is_primary", { ascending: false }),
  ]);
  if (!job) return { ok: false as const, error: "Campaign not found." };

  const handle = clean(handles?.[0]?.handle ?? applicant?.handle ?? "").toLowerCase();
  if (!handle) return { ok: false as const, error: "Creator has no handle." };

  const { counts, errors } = await countViews({
    id: assignment.id,
    creator_name: "",
    campaign: job.title,
    instagram_handle: "",
    tiktok_handle: "",
    youtube_handle: "",
    post_links: assignment.proof_url,
    status: "approved",
    approved_at: null,
    last_counted_at: null,
    count_error: null,
    created_at: "",
  });
  if (errors.length > 0) return { ok: false as const, error: errors.join("; ") };

  const views = platform === "instagram" ? counts.instagram : platform === "tiktok" ? counts.tiktok : counts.youtube;
  const { error } = await db
    .from("campaign_views")
    .upsert(
      [{ campaign: job.title, platform, handle, views, updated_at: new Date().toISOString() }],
      { onConflict: "campaign,platform,handle" },
    );
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
