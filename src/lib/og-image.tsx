import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// Same light theme as the site's CSS, hardcoded as static hex since
// ImageResponse renders in an isolated Satori context that can't read
// globals.css custom properties. Keep these in sync with globals.css's
// :root tokens by eye if that palette changes.
const COLORS = {
  bg: "#fbf6ee",
  primary: "#c8552a",
  foreground: "#2a2318",
  muted: "#7d7266",
};

/**
 * Renders the branded 1200x630 card used for both Open Graph and Twitter
 * card images. Route files (opengraph-image.tsx / twitter-image.tsx) just
 * call this with page-specific copy.
 */
export function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: COLORS.bg,
          border: `4px solid ${COLORS.foreground}`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: COLORS.primary,
              display: "flex",
            }}
          />
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: COLORS.foreground,
            }}
          >
            Off Camera
          </span>
        </div>

        {eyebrow && (
          <span
            style={{
              marginTop: 48,
              fontSize: 24,
              fontWeight: 600,
              color: COLORS.primary,
              display: "flex",
            }}
          >
            {eyebrow}
          </span>
        )}

        <span
          style={{
            marginTop: 16,
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.foreground,
            lineHeight: 1.15,
            maxWidth: 920,
            display: "flex",
          }}
        >
          {title}
        </span>

        <span
          style={{
            marginTop: 24,
            fontSize: 28,
            color: COLORS.muted,
            maxWidth: 820,
            display: "flex",
          }}
        >
          {subtitle}
        </span>
      </div>
    ),
    { ...OG_IMAGE_SIZE }
  );
}
