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

            The mask is done with the plain CSS mask-image/mask-mode
            properties (see .liquid-bg-photo in globals.css), not an inline
            SVG <mask> element. An SVG <mask> with
            maskContentUnits="objectBoundingBox" wrapping a raster <image>
            looks correct in Chrome but was confirmed (against real WebKit,
            via Playwright's webkit engine, which mirrors Safari) to fail
            outright there — the photo renders fully unmasked, solid black
            backdrop and all, exactly matching the bug reported in Safari.
            The plain mask-image + mask-mode: luminance /
            -webkit-mask-image + -webkit-mask-source-type: luminance pairing
            was verified working in that same real WebKit engine.

            Content is wrapped in its own `relative z-10` box rather than
            giving this a negative z-index — a `position:fixed` layer with
            a negative z-index can end up painted behind `<body>`'s own
            propagated background regardless of DOM order. */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
          <div className="liquid-bg-pan liquid-bg-photo absolute inset-0" />
        </div>
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
