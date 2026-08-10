import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "UGC course",
    "faceless content",
    "faceless UGC",
    "brand deals",
    "content creator course",
    "TikTok UGC",
  ],
  authors: [{ name: siteConfig.creator.name }],
  creator: siteConfig.creator.name,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* The real liquid-metal photo as a persistent, sitewide background —
            fixed to the viewport so it covers top to bottom at any scroll
            position, not just the Hero's own height, at full strength
            (the photo's own colors are untouched, nothing washed out).

            Turning its black backdrop into cream is a *mask*, not a blend:
            mix-blend-mode: screen was the wrong tool against a *light*
            page — screen can only ever lighten toward the backdrop, never
            preserve something darker than it, so it flattened the metal's
            own dark grooves toward white along with the black.

            The mask itself is a real inline SVG <mask> (below), not the
            CSS `mask-image` + `mask-mode: luminance` shorthand — that
            combination has inconsistent cross-browser support (Safari and
            some Chrome versions silently fall back to alpha-only masking,
            and since this PNG has no real transparency, alpha masking
            does nothing at all: the photo just renders unmasked, solid
            black backdrop and all). An SVG <mask> is luminance-based by
            spec default in every browser with no extra property needed,
            so it doesn't have that fallback failure mode.

            Content is wrapped in its own `relative z-10` box rather than
            giving this a negative z-index — a `position:fixed` layer with
            a negative z-index can end up painted behind `<body>`'s own
            propagated background regardless of DOM order. */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <mask
              id="liquid-bg-mask"
              maskContentUnits="objectBoundingBox"
              maskUnits="objectBoundingBox"
            >
              <image
                href="/images/hero-liquid-metal-full.png"
                width={1}
                height={1}
                preserveAspectRatio="xMidYMid slice"
              />
            </mask>
          </defs>
        </svg>
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
          <div className="liquid-bg-pan liquid-bg-photo absolute inset-0" />
        </div>
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
