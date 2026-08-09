import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import { LiquidMetalField } from "@/components/site/liquid-metal-field";
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Sitewide ambient strokes, not just the marketing pages — the
            page's real --background stays a plain solid dark surface;
            these two layers add a few flowing chrome/violet highlight
            lines across it, not a filled texture. Fixed to the viewport
            (not the document), z-below everything real including the
            marketing SymbolField. Only a transform animates on top of the
            already-rendered SVGs, so the filters themselves never re-run
            per frame. */}
        <LiquidMetalField
          seed={7}
          tint="#f4f5f8"
          angle={230}
          exponent={60}
          className="liquid-metal-drift pointer-events-none fixed inset-0 -z-20 size-full opacity-[0.14]"
        />
        <LiquidMetalField
          seed={31}
          tint="oklch(0.78 0.05 290)"
          angle={100}
          exponent={55}
          className="liquid-metal-drift-alt pointer-events-none fixed inset-0 -z-20 size-full opacity-[0.1]"
        />
        {children}
      </body>
    </html>
  );
}
