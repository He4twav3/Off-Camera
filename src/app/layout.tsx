import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

/**
 * TWO FACES, ONE JOB EACH.
 *
 * DM Sans for everything display — the logo, every heading, the big
 * numbers. It is a low-contrast geometric grotesque: rounder and warmer
 * than Inter in the letterforms, but with none of the quirk that makes a
 * display face read as playful. At 500–600 weight with tracking at or
 * near zero it is the register the reference site sets its entire type
 * scale in, which is where this choice comes from — not a guess about
 * what "premium" looks like.
 *
 * Inter stays for body copy, where its neutrality and its enormous
 * x-height are exactly what you want for paragraphs at 15–17px. Using
 * DM Sans for both would flatten the page back to one voice, which is
 * the problem the previous single-face setup had: headings and body were
 * literally the same font at different sizes, so nothing on the page had
 * a hierarchy that came from the type itself.
 *
 * (The heading face was Fraunces before that — a soft, wonky variable
 * display serif — and it read as storybook rather than premium. DM Sans
 * is the opposite trade: still a distinct voice from the body, but a
 * sober one.)
 */
const heading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
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
    "short-form content course",
    "viral video hooks",
    "content retention",
    "UGC course",
    "faceless content",
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
      <body className="dark-invert min-h-full bg-background text-foreground">
        <div className="flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
