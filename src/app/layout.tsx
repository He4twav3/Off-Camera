import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
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
 * Plus Jakarta Sans for body copy — every paragraph, label and link.
 * Replaced Geist here deliberately: Geist paired fine with DM Sans, but
 * once Bricolage Grotesque (below) stopped being wordmark-only and
 * started carrying the hero claim and every chapter heading, the body
 * face needed to sit *with* that voice instead of next to it — Plus
 * Jakarta Sans shares Bricolage Grotesque's rounded, slightly warm
 * geometric character (soft terminals, a friendly rather than clinical
 * grotesque) at a register calm enough for 12–16px copy, where
 * Bricolage's own quirks would be too much. Still a large x-height and
 * open apertures, same reason Geist had them: dense copy stays legible
 * on a dark ground.
 *
 * DM Sans stays the mid-tier: card titles, labels, anything that's a
 * heading but not one of the two biggest statements per page.
 *
 * Bricolage Grotesque for the wordmark, the hero's own h1, and every
 * numbered chapter heading (section-frame.tsx's SectionHeader) — three
 * places, not one anymore. Originally measured off the reference site's
 * own oversized footer lettering (x-height/cap-height ratio 0.82 against
 * DM Sans's 0.74 — their navbar SVG is an unrelated stock asset the
 * template ships with, not real evidence, which is why the footer
 * lettering is what this was actually measured from) and kept
 * deliberately confined to the logo at first. Extended since: the two
 * biggest single statements on any page here (the hero's claim, each
 * chapter's title) now speak in the same voice as the logo above them,
 * which is what makes the whole page feel like one brand's voice at
 * different volumes rather than a logo bolted onto a generic template.
 *
 * Two weights, for two very different sizes of the same word. 500 is
 * what the oversized footer lettering actually measures to — at that
 * scale the huge x-height alone reads as bold, so the stroke can stay
 * comparatively light. The small navbar/logo instance, and both of the
 * newer big-statement uses, read thin at 500 without that scale to lean
 * on — set at 700 (font-bold) everywhere else it appears.
 */
const heading = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Plus_Jakarta_Sans({
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
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
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
      // A literal dark background here too, not just on <body> below —
      // <html>'s own background is what shows through during a mobile
      // browser's rubber-band overscroll bounce (dragging past the top/
      // bottom edge), since that gesture reveals whatever's *behind*
      // <body>, not <body> stretching to cover it. Left unset, that's
      // the browser's own default (white), a flash of the wrong colour
      // at the exact edges of the screen on every phone.
      //
      // A literal hex, not `dark-invert bg-background` (the token this
      // color actually has everywhere else on the site): <html> IS
      // `:root`, and globals.css's own light-theme `--background` is
      // declared under `:root` *later* in the file than `dark-invert.css`
      // gets @import-ed — same specificity, later source position wins,
      // so putting the `dark-invert` class on the one element that's
      // also `:root` doesn't override `:root`'s own light value the way
      // it does on every other element, it loses to it. `<body>` doesn't
      // have this problem (it's `.dark-invert` but never `:root`), which
      // is exactly why this needed a second, different fix rather than
      // just copying body's.
      className={`${heading.variable} ${body.variable} ${wordmark.variable} h-full bg-[#16151a] antialiased`}
    >
      <body className="dark-invert min-h-full bg-background text-foreground">
        <div className="flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
