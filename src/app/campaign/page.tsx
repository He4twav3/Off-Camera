import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { CampaignForm } from "./campaign-form";
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
 * Campaign signup — a native form that posts (via a server action) to a
 * Zapier catch-hook, instead of linking out to / embedding the hosted
 * Zapier Interface. That Interface can't be iframed: Zapier's own pages
 * send `Content-Security-Policy: frame-ancestors 'self' zapier.com ...`,
 * which the browser enforces on any outside domain, and it 404s for
 * logged-out visitors. Building the fields here sidesteps both and keeps
 * the site's own styling. See actions.ts for the webhook contract.
 *
 * Standalone outside the marketing route group, same as /login, /signup
 * and /go — a focused page with no nav/search/section-pill chrome to
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

      <div className="w-full max-w-md text-center">
        <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Join a campaign
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Drop your handles in and we&apos;ll be in touch about current and
          upcoming campaigns.
        </p>

        <div className="card-sticker mt-8 rounded-2xl bg-card p-6 sm:p-8">
          <CampaignForm />
        </div>
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
