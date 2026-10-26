import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    eyebrow: "For brands and creators",
    title: "Real creators. Real views. Paid for performance.",
    subtitle:
      "Brands run campaigns, creators get paid for their views on TikTok, Instagram and YouTube Shorts.",
  });
}
