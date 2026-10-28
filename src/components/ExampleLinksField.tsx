"use client";

import { useRef, useState } from "react";
import { Check, Film, ImagePlus, Plus, Upload, X } from "lucide-react";
import { MAX_EXAMPLES } from "@/lib/campaign-brief";
import { createClient } from "@/lib/supabase/client";
import { EXAMPLE_VIDEO_BUCKET, MAX_EXAMPLE_VIDEO_BYTES, coverPath, exampleVideoType, isUploadedExample } from "@/lib/example-videos";
import { startExampleCoverUploadAction, startExamplePosterUploadAction, startExampleUploadAction } from "@/app/example-videos/actions";
import { brightFrame } from "@/lib/video-frame";

/**
 * Example links as an organised list: one link per row, an X to remove it, and "Add another" up to the limit.
 * A video file can be uploaded instead of a link; it is stored with us and always plays on the campaign page.
 * It submits a hidden field (one link per line, `examples` unless told otherwise), so the forms' saving is unchanged.
 */
export function ExampleLinksField({ initial = "", name = "examples" }: { initial?: string; name?: string }) {
  const start = initial.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [rows, setRows] = useState<string[]>(start.length ? start : [""]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  // A hand-added thumbnail for a TikTok or Instagram link: which row is picking one, and which links have one now.
  const coverInput = useRef<HTMLInputElement>(null);
  const [coverFor, setCoverFor] = useState<string | null>(null);
  const [covered, setCovered] = useState<string[]>([]);
  const [coverBusy, setCoverBusy] = useState(false);
  const set = (i: number, v: string) => setRows((r) => r.map((x, j) => (j === i ? v : x)));
  const filled = rows.filter((r) => r.trim()).length;

  async function upload(file: File) {
    setError("");
    const type = exampleVideoType(file);
    if (!type) return setError("Use an MP4, MOV or WebM video.");
    if (file.size > MAX_EXAMPLE_VIDEO_BYTES) return setError("Keep each video under 50 MB.");
    setUploading(true);
    try {
      const begun = await startExampleUploadAction({ type, size: file.size });
      if (!begun.ok) return setError(begun.error);
      const { error: uploadError } = await createClient()
        .storage.from(EXAMPLE_VIDEO_BUCKET)
        .uploadToSignedUrl(begun.path, begun.token, file, { contentType: type });
      if (uploadError) return setError("The upload didn't finish. Please try again.");
      // Its thumbnail: a frame that isn't dark, saved beside the video. Never blocks the upload.
      await savePoster(file, begun.url);
      setRows((r) => {
        const kept = r.filter((x) => x.trim());
        return kept.length < MAX_EXAMPLES ? [...kept, begun.url] : r;
      });
    } catch {
      setError("The upload didn't finish. Please try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function saveCover(file: File, link: string) {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Use a JPG, PNG or WebP image for the thumbnail.");
    setCoverBusy(true);
    try {
      const jpeg = await toJpeg(file);
      if (!jpeg) return setError("That image couldn't be read. Try a screenshot saved as JPG or PNG.");
      const start = await startExampleCoverUploadAction({ url: link });
      if (!start.ok) return setError(start.error);
      const { error: upErr } = await createClient()
        .storage.from(EXAMPLE_VIDEO_BUCKET)
        .uploadToSignedUrl(start.path, start.token, jpeg, { contentType: "image/jpeg", upsert: true });
      if (upErr) return setError("The thumbnail didn't upload. Please try again.");
      setCovered((c) => [...c, link]);
    } finally {
      setCoverBusy(false);
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  async function savePoster(file: File, videoUrl: string) {
    try {
      const still = await brightFrame(file);
      if (!still) return;
      const start = await startExamplePosterUploadAction({ videoUrl });
      if (!start.ok) return;
      await createClient().storage.from(EXAMPLE_VIDEO_BUCKET).uploadToSignedUrl(start.path, start.token, still, { contentType: "image/jpeg", upsert: true });
    } catch {
      /* the card makes its own thumbnail instead */
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={rows.map((r) => r.trim()).filter(Boolean).join("\n")} />
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
            {isUploadedExample(r) ? (
              <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                <Film className="size-4 shrink-0 text-muted-foreground" />
                Uploaded video
                <a href={r} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-semibold text-primary hover:underline">
                  Preview
                </a>
              </span>
            ) : (
              <input
                type="url"
                value={r}
                onChange={(e) => set(i, e.target.value)}
                placeholder="Paste a link"
                aria-label={`Example link ${i + 1}`}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            )}
            {coverPath(r.trim()) && (
              <button
                type="button"
                disabled={coverBusy}
                onClick={() => {
                  setCoverFor(r.trim());
                  coverInput.current?.click();
                }}
                title="Add a thumbnail: a screenshot of the video"
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-muted disabled:cursor-wait disabled:opacity-60 ${
                  /tiktok\.com/.test(r) && !covered.includes(r.trim()) ? "bg-amber-400/15 text-amber-500" : "text-primary"
                }`}
              >
                {covered.includes(r.trim()) ? <Check className="size-4" /> : <ImagePlus className="size-4" />}
                {covered.includes(r.trim())
                  ? "Thumbnail added"
                  : coverBusy && coverFor === r.trim()
                    ? "Uploading…"
                    : /tiktok\.com/.test(r)
                      ? "Add thumbnail (TikTok sends none)"
                      : "Add thumbnail"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setRows((x) => (x.length === 1 ? [""] : x.filter((_, j) => j !== i)))}
              aria-label={`Remove example ${i + 1}`}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {filled < MAX_EXAMPLES && (
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
          {rows.length < MAX_EXAMPLES && (
            <button
              type="button"
              onClick={() => setRows((r) => [...r, ""])}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus className="size-4" />
              Add another link
            </button>
          )}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
          >
            <Upload className="size-4" />
            {uploading ? "Uploading…" : "Upload a video"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </div>
      )}
      <input
        ref={coverInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && coverFor) void saveCover(file, coverFor);
        }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Uploaded videos always play on the campaign page. MP4, MOV or WebM, up to 50 MB. TikTok doesn&apos;t share a cover
        picture, so use Add thumbnail with a screenshot of the video.
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** The image as a JPEG, at most 720 pixels wide, so every thumbnail is the same kind of small file. */
async function toJpeg(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 720 / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  }
}
