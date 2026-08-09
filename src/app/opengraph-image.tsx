import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    eyebrow: "A course by a working UGC creator",
    title: "Go viral without showing your face.",
    subtitle:
      "Learn to create faceless content that brands pay for, taught by Aron.",
  });
}
