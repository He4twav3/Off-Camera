/**
 * Example videos uploaded to our own storage. Platform embeds are unreliable (Instagram often refuses to play a reel
 * on another site), so a brand or an admin can upload the video file itself and it always plays on the campaign page.
 * The files sit in a public bucket: examples are meant to be watched by any creator, like the brief itself.
 */
export const EXAMPLE_VIDEO_BUCKET = "example-videos";

/** Supabase's free plan caps a single upload at 50 MB. */
export const MAX_EXAMPLE_VIDEO_BYTES = 50 * 1024 * 1024;

/** Accepted video types and the file extension each is saved with. */
export const EXAMPLE_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** The file's video type, falling back to its extension when the browser reports none. */
export function exampleVideoType(file: { type: string; name: string }): string | null {
  if (EXAMPLE_VIDEO_TYPES[file.type]) return file.type;
  const ext = file.name.toLowerCase().split(".").pop();
  const match = Object.entries(EXAMPLE_VIDEO_TYPES).find(([, e]) => e === ext);
  return match ? match[0] : null;
}

/** True for a link to one of our uploaded example videos. */
export function isUploadedExample(url: string): boolean {
  try {
    return new URL(url).pathname.includes(`/storage/v1/object/public/${EXAMPLE_VIDEO_BUCKET}/`);
  } catch {
    return false;
  }
}
