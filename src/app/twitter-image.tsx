import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    eyebrow: "Creator campaigns, paid for results",
    title: "Real creators. Real views. Paid for performance.",
    subtitle:
      "Creators post for your brand on TikTok, Instagram and YouTube Shorts, with every view tracked.",
  });
}
