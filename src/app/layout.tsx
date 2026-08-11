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
        {/* TEMPORARY diagnostic — not real product code, remove once the
            real-iPhone blank-content bug is actually root-caused. Plain
            inline <script>, not a React effect, so it runs before React
            even attaches and survives if hydration itself is the problem.
            Next's dev server forwards browser console output to the
            terminal, so this shows up in the server log on any real load
            without needing the user to open dev tools. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              function log(label, data) {
                // console.error, not .log -- Next's dev browser-console
                // forwarding to the terminal only relays .error (confirmed
                // by testing: .log calls never showed up server-side).
                try { console.error('[DIAG]', label, JSON.stringify(data)); }
                catch (e) { console.error('[DIAG]', label, String(data)); }
              }
              window.addEventListener('error', function (e) {
                console.error('[DIAG] window.error:', e.message, 'at', e.filename + ':' + e.lineno + ':' + e.colno, e.error && e.error.stack);
              });
              window.addEventListener('unhandledrejection', function (e) {
                console.error('[DIAG] unhandledrejection:', e.reason && (e.reason.stack || e.reason.message || e.reason));
              });
              function envInfo() {
                return {
                  ua: navigator.userAgent,
                  viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
                  IntersectionObserver: typeof IntersectionObserver !== 'undefined',
                  webgl: (function () { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return 'threw: ' + e.message; } })(),
                };
              }
              function dump(when) {
                log(when + ' env', envInfo());
                var h1 = document.querySelector('h1');
                if (!h1) { log(when + ' h1', 'NOT IN DOM'); return; }
                var cs = getComputedStyle(h1);
                var rect = h1.getBoundingClientRect();
                var wrap = h1.closest('div[style]');
                var wrapCs = wrap ? getComputedStyle(wrap) : null;
                log(when + ' h1', {
                  text: h1.textContent,
                  opacity: cs.opacity, display: cs.display, visibility: cs.visibility, color: cs.color,
                  rect: { top: rect.top, w: rect.width, h: rect.height },
                  wrapOpacity: wrapCs ? wrapCs.opacity : null,
                  wrapTransform: wrapCs ? wrapCs.transform : null,
                });
              }
              // Fired at three separate points (not just once) specifically
              // because the very first synchronous calls have been observed
              // to get lost — the dev console-forwarding channel itself
              // needs a moment to connect after navigation, so anything
              // logged before that connects never reaches the terminal.
              dump('t=0');
              setTimeout(function () { dump('t=1s'); }, 1000);
              setTimeout(function () { dump('t=2.5s'); log('bodyTextLen', document.body.innerText.length); }, 2500);
              setTimeout(function () { dump('t=5s'); }, 5000);
            })();`,
          }}
        />
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
