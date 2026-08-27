import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Geist } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

/**
 * THREE FACES, EACH WITH ONE JOB.
 *
 * DM Sans for every heading and the general display register. It is a
 * low-contrast geometric grotesque: rounder and warmer than Inter in the
 * letterforms, but with none of the quirk that makes a display face read
 * as playful. At 500–600 weight with tracking at or near zero it is the
 * register the reference site sets its entire heading scale in, which is
 * where this choice comes from — not a guess about what "premium" looks
 * like.
 *
 * Geist for body copy. This is the other half of the reference site's
 * pairing, measured off it rather than guessed: its headings render in
 * DM Sans and every paragraph, label and link in Geist — 16px/400 for
 * body, 14px/500 for column headings, 12px/400 for small print. Geist is
 * a modern neutral grotesque with a large x-height and open apertures,
 * which is what keeps 12–16px copy legible on a dark ground where a
 * tighter face would close up.
 *
 * Bricolage Grotesque for the wordmark only — the name inside the logo,
 * and nowhere else. The reference site keeps a third face in reserve for
 * exactly one job: its own oversized "Parley" lettering at the bottom of
 * the page is not set in its heading face. It measures out to a
 * different letter — an x-height/cap-height ratio of 0.82, against DM
 * Sans's 0.74 — and Bricolage Grotesque is the Google-served face that
 * actually lands there (confirmed twice: the ratio matches to within a
 * point, and the family is already in this page's own font stack, set on
 * its promo-button label at the same -0.04em tracking used here). Their
 * navbar SVG is not that evidence — it turned out to be an unrelated
 * stock asset the template ships with (it reads "Cloudplex" under
 * inspection, nothing to do with their brand), which is why the giant
 * footer lettering, not the navbar mark, is what this was measured from.
 *
 * Two weights, for two very different sizes of the same word. 500 is
 * what the oversized footer lettering actually measures to — at that
 * scale the huge x-height alone reads as bold, so the stroke can stay
 * comparatively light. The small navbar/logo instance of the same word
 * doesn't have that scale to lean on, and 500 at 1.15rem reads thin
 * rather than confident — so it's set at 700 there instead, which is
 * both visibly closer to how their own small lettering actually looks
 * and the standard fix for the same face needing more weight in hand the
 * smaller it's set.
 *
 * Three faces, one of them in two weights, still isn't four: nothing
 * else on the page moves to Bricolage Grotesque, so the heading/body
 * hierarchy DM Sans and Geist establish stays exactly as it was.
 */
const heading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const wordmark = Bricolage_Grotesque({
  variable: "--font-wordmark",
  subsets: ["latin"],
  weight: ["500", "700"],
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
      className={`${heading.variable} ${body.variable} ${wordmark.variable} h-full antialiased`}
    >
      <body className="dark-invert min-h-full bg-background text-foreground">
        <div className="flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
