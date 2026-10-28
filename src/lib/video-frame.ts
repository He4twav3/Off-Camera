/**
 * A still from a video for its thumbnail, in the browser: it looks at a few moments in the video and takes the first
 * frame that isn't dark, so a video that opens on black still gets a real picture. Null when the browser can't read
 * the video (the card then shows its plain tile). Never throws.
 */
const MAX_WIDTH = 720;
// Average brightness, 0 to 255, below which a frame counts as dark.
const DARK = 40;

export async function brightFrame(source: File | string): Promise<Blob | null> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  const objectUrl = typeof source === "string" ? null : URL.createObjectURL(source);
  video.src = objectUrl ?? (source as string);
  try {
    await once(video, "loadedmetadata");
    const d = Number.isFinite(video.duration) ? video.duration : 0;
    const times = [0.5, 1, 1.5, 2, 3, d * 0.25, d * 0.5, d * 0.75].filter((t) => t > 0 && (d === 0 || t < d));
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
    canvas.width = Math.max(1, Math.round((video.videoWidth || MAX_WIDTH) * scale));
    canvas.height = Math.max(1, Math.round((video.videoHeight || MAX_WIDTH * (16 / 9)) * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    let best: { t: number; light: number } | null = null;
    for (const t of times.length ? times : [0.01]) {
      video.currentTime = t;
      await once(video, "seeked");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const light = brightness(ctx, canvas.width, canvas.height);
      if (!best || light > best.light) best = { t, light };
      if (light >= DARK) break;
    }
    if (!best) return null;
    if (video.currentTime !== best.t) {
      video.currentTime = best.t;
      await once(video, "seeked");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}

/** Waits for one event, or fails after a few seconds so a stuck video never hangs the page. */
function once(el: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => done(new Error("timeout")), 8000);
    const onEvent = () => done();
    const onError = () => done(new Error("video error"));
    function done(err?: Error) {
      clearTimeout(timer);
      el.removeEventListener(event, onEvent);
      el.removeEventListener("error", onError);
      if (err) reject(err);
      else resolve();
    }
    el.addEventListener(event, onEvent);
    el.addEventListener("error", onError);
  });
}

/** The frame's average brightness, from a sample of its pixels. Throws if the video's pixels can't be read. */
function brightness(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4 * 16) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++;
  }
  return n ? sum / n : 0;
}
