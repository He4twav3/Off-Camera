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
            position, not just the Hero's own height.

            Turning its black backdrop into cream used to be a live CSS
            mask (mix-blend-mode: screen was tried first and was wrong —
            it can only lighten toward the backdrop, never preserve
            something darker, so it flattened the metal's own dark grooves
            toward white too). Every CSS masking technique that followed
            (an inline SVG <mask>, then plain mask-image/mask-mode +
            -webkit-mask-image/-webkit-mask-source-type) tested fine
            against Playwright's real Chromium *and* WebKit engines, yet
            still failed on an actual iPhone in both Safari and Chrome —
            iOS's real WebKit build has its own further masking support
            gaps neither of those emulated engines reproduced. Rather than
            keep chasing per-engine CSS masking support, the knockout is
            now baked directly into the image's own pixels once at asset-
            prep time (scripts/bake-liquid-bg.mjs) — plain background-image,
            no runtime masking of any kind, so there's nothing left for any
            browser to get wrong.

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
