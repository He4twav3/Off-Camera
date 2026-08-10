// One-off asset-prep script, not run at build time: composites the
// black-to-cream knockout directly into the liquid-metal photo's pixels
// (see the comment on .liquid-bg-photo in globals.css for why this
// replaced a live CSS mask), and re-encodes it as a much lighter WebP for
// the actual sitewide background. Re-run with `node scripts/bake-liquid-bg.mjs`
// from the project root if the source photo or the --background cream
// token ever changes.
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const SRC = path.join(here, "assets/hero-liquid-metal-source.png");
const OUT_WEBP = path.join(root, "public/images/hero-liquid-metal-bg.webp");

// Cream --background resolved to sRGB via canvas: rgb(249, 244, 238)
const CREAM = [249, 244, 238];

const img = sharp(SRC).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const out = Buffer.alloc(data.length);

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Standard Rec. 709 relative luminance on the gamma-encoded sRGB bytes.
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  out[i] = Math.round(r * L + CREAM[0] * (1 - L));
  out[i + 1] = Math.round(g * L + CREAM[1] * (1 - L));
  out[i + 2] = Math.round(b * L + CREAM[2] * (1 - L));
  out[i + 3] = 255;
}

// 1800px longest side is still sharp for a full-bleed cover background even
// on large hi-DPI desktops, and far lighter than the original 2300x2300
// source for phones on cellular/slow wifi.
await sharp(out, { raw: { width, height, channels } })
  .resize({ width: 1800, height: 1800, fit: "inside" })
  .webp({ quality: 82 })
  .toFile(OUT_WEBP);

console.log(`baked ${width}x${height} -> ${OUT_WEBP}`);
