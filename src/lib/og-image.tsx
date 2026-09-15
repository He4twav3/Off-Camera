import { ImageResponse } from "next/og";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

// The site's actual dark theme (dark-invert.css's --background/--primary/
// --crimson-bright/--muted-foreground), hardcoded as static hex since
// ImageResponse renders in an isolated Satori context that can't read
// globals.css custom properties. Keep these in sync with dark-invert.css's
// literals by eye if that palette changes — this is the same "flat
// crimson-on-charcoal, no second hue anywhere" system, not a separate
// light-theme card living on to describe a site that no longer looks
// like it (see that file's own header note on the palette itself).
const COLORS = {
  bg: "#16151a",
  primary: "#ac0216",
  foreground: "#edeae4",
  muted: "#706c68",
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
          border: "1px solid rgba(237,234,228,0.12)",
          fontFamily: "sans-serif",
        }}
      >
        {/* The real mark (brand-mark.tsx's four corners + tally dot),
            not a generic dot standing in for it — this card is the
            logo, so it should show the actual logo. currentColor isn't
            available in this isolated Satori context the way the live
            component gets it from its parent, so the stroke is the
            card's own foreground literal instead. */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <g stroke={COLORS.foreground} strokeWidth={2} strokeLinecap="square">
              <path d="M3 8.5V3h5.5" />
              <path d="M15.5 3H21v5.5" />
              <path d="M21 15.5V21h-5.5" />
              <path d="M8.5 21H3v-5.5" />
            </g>
            <circle cx={12} cy={12} r={2.75} fill={COLORS.primary} />
          </svg>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: COLORS.foreground,
            }}
          >
            OnCamera
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
