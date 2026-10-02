import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/lib/site-config";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Join a campaign",
  description: `Sign up with your social handles to join a ${siteConfig.name} campaign.`,
  // Not a page meant to show up in search — this is a link handed directly
  // to people (e.g. in Discord), same reasoning as /login and /signup.
  robots: { index: false, follow: false },
  alternates: { canonical: "/campaign" },
};

/**
 * Campaign signup — a thin wrapper around a Zapier Interfaces embed, not a
 * page built from scratch here. The form itself (fields, validation,
 * where submissions land/get tracked) all lives on Zapier's side; this
 * page's only job is to present it inside the site's own chrome instead
 * of sending people off to a bare interfaces.zapier.com URL.
 *
 * Standalone outside the marketing route group, same as /login, /signup
 * and /go — a focused link with no nav/search/section-pill chrome to
 * distract from the one thing this page is for. dark-invert imported and
 * applied directly rather than relying only on the body-level class for
 * the same reason those pages do (see login/page.tsx's own note).
 */
export default function CampaignPage() {
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center bg-background px-4 py-12 text-foreground sm:py-16">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full max-w-2xl text-center">
        <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Join a campaign
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Drop your handles below and we&apos;ll be in touch about current
          and upcoming campaigns.
        </p>
      </div>

      {/* card-sticker, not card-premium — matches the other standalone
          pages this one sits alongside (login, signup, go), all of which
          use the toybox sticker system rather than the homepage's premium
          surface language. Padding is tighter than those cards (p-2
          instead of p-6+) since the content here is an iframe that brings
          its own internal padding — stacking the site's card padding on
          top of Zapier's own would just double it up. */}
      <div className="card-sticker mt-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-card p-2">
        <iframe
          src="https://interfaces.zapier.com/interfaces/cmuqtgxqb000qryi4pjgzim8t"
          title="Campaign signup"
          width="100%"
          height="600"
          loading="lazy"
          style={{ border: "none", borderRadius: "12px", display: "block" }}
        />
      </div>

      <Link
        href="/"
        className="mt-10 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to {siteConfig.name}
      </Link>
    </div>
  );
}
