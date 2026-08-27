import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    eyebrow: "Built on real results, not theory",
    title: "You don't need a following to get views.",
    subtitle:
      "Real videos that reached millions of views, and the system behind them.",
  });
}
