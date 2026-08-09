import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";
import { siteConfig } from "@/lib/site-config";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    eyebrow: `${siteConfig.price.formatted} · Lifetime access`,
    title: "Off Camera: Faceless Content & Brand Deals",
    subtitle:
      "8 modules, 25 lessons. Everything you need to create, pitch, and get paid.",
  });
}
