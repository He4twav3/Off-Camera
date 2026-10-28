import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAMPLE_VIDEO_BUCKET, EXAMPLE_VIDEO_TYPES, MAX_EXAMPLE_VIDEO_BYTES, coverPath } from "@/lib/example-videos";
import { fetchInstagramPoster, fetchTikTokPoster } from "@/lib/proof-thumbnails";

/**
 * Thumbnails for example videos, kept in our own storage so they never expire. TikTok and Instagram hand out cover
 * images on links that stop working after a while (and TikTok's embed details no longer carry one at all), which
 * left cards blank. The first time a cover is found it is copied into the example-videos bucket, and from then on
 * the card uses our copy. An uploaded video's thumbnail is saved beside it when it is uploaded
 * (`<video>.jpg`, see ExampleLinksField). Everything here returns null rather than throwing; the card then shows its
 * plain tile.
 */
/** The bucket, made if missing and allowed to hold the thumbnails as well as the videos. */
export async function ensureExampleBucket(): Promise<boolean> {
  const storage = createAdminClient().storage;
  const types = [...Object.keys(EXAMPLE_VIDEO_TYPES), "image/jpeg"];
  const { data: bucket } = await storage.getBucket(EXAMPLE_VIDEO_BUCKET);
  if (!bucket) {
    const { error } = await storage.createBucket(EXAMPLE_VIDEO_BUCKET, { public: true, fileSizeLimit: MAX_EXAMPLE_VIDEO_BYTES, allowedMimeTypes: types });
    if (error && !/exist/i.test(error.message)) {
      console.error("example-videos: couldn't create the bucket:", error.message);
      return false;
    }
    return true;
  }
  if (bucket.allowed_mime_types && !bucket.allowed_mime_types.includes("image/jpeg")) {
    const { error } = await storage.updateBucket(EXAMPLE_VIDEO_BUCKET, { public: true, fileSizeLimit: MAX_EXAMPLE_VIDEO_BYTES, allowedMimeTypes: types });
    if (error) console.error("example-videos: couldn't allow thumbnails:", error.message);
  }
  return true;
}

/** The path inside the bucket of an uploaded video's thumbnail, from the video's public link. */
export function uploadPosterPath(videoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${EXAMPLE_VIDEO_BUCKET}/`;
  const i = videoUrl.indexOf(marker);
  if (i < 0) return null;
  const path = decodeURIComponent(videoUrl.slice(i + marker.length).split(/[?#]/)[0]);
  return path.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
}

function publicUrl(path: string): string {
  return createAdminClient().storage.from(EXAMPLE_VIDEO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** True when the file is in the bucket. */
async function stored(path: string): Promise<boolean> {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data } = await createAdminClient().storage.from(EXAMPLE_VIDEO_BUCKET).list(dir, { search: name, limit: 5 });
  return (data ?? []).some((f) => f.name === name);
}

/** An uploaded video's saved thumbnail, if it has one. */
export async function uploadedPoster(videoUrl: string): Promise<string | null> {
  try {
    const path = uploadPosterPath(videoUrl);
    return path && (await stored(path)) ? publicUrl(path) : null;
  } catch {
    return null;
  }
}

/** Copies an image into the bucket and returns our link to it; null if it isn't a real image. */
async function keep(imageUrl: string, path: string): Promise<string | null> {
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(6000), cache: "no-store" });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) return null;
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength < 2000) return null;
  if (!(await ensureExampleBucket())) return null;
  const { error } = await createAdminClient()
    .storage.from(EXAMPLE_VIDEO_BUCKET)
    .upload(path, new Blob([bytes], { type: "image/jpeg" }), { upsert: true, contentType: "image/jpeg" });
  if (error) {
    console.error("example-covers: couldn't keep a cover:", error.message);
    return null;
  }
  return publicUrl(path);
}

/**
 * A lasting thumbnail for a TikTok or Instagram example: our copy if we have one,
 * otherwise the platform's cover, copied into our storage on the way. Null when none can be found.
 */
export async function lastingCover(platform: string, url: string): Promise<string | null> {
  try {
    const path = coverPath(url);
    if (!path) return null;
    if (await stored(path)) return publicUrl(path);
    const source = platform === "tiktok" ? await fetchTikTokPoster(url) : await fetchInstagramPoster(url);
    if (!source) return null;
    return (await keep(source, path)) ?? source;
  } catch {
    return null;
  }
}
