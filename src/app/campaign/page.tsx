import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import "@/styles/dark-invert.css";

const CAMPAIGN_FORM_URL = "https://interfaces.zapier.com/interfaces/cmuqtgxqb000qryi4pjgzim8t";

export const metadata: Metadata = {
  title: "Join a campaign",
  description: `Sign up with your social handles to join a ${siteConfig.name} campaign.`,
  // Not a page meant to show up in search — this is a link handed directly
  // to people (e.g. in Discord), same reasoning as /login and /signup.
  robots: { index: false, follow: false },
  alternates: { canonical: "/campaign" },
};

/**
 * Campaign signup — a link out to the Zapier Interfaces form, not an embed.
 * It WAS an iframe here, but Zapier's own Interfaces pages send
 * `Content-Security-Policy: frame-ancestors 'self' zapier.com
 * zapier-staging.com ...` — a header on *their* response that the browser
 * enforces, blocking the page from being framed on any outside domain.
 * No change on this site's end can work around that (it's not our CSP);
 * confirmed live — the embed rendered as a blank "refused to connect" box
 * for every visitor. A direct link sidesteps it entirely: no framing, no
 * CSP to violate.
 *
 * If a same-site-feeling embed matters enough to pursue further, the real
 * fix is one of: (a) check the Interface's own Share/Embed settings in
 * the Zapier dashboard for an allowed-domains option (plan-dependent, not
 * something visible or controllable from here), or (b) drop the hosted
 * Interface for this page and build the fields natively here instead,
 * posting to a Zapier webhook trigger — more work, but fully sidesteps
 * the CSP wall and keeps the site's own styling throughout.
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

      <div className="w-full max-w-md text-center">
        <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Join a campaign
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Drop your handles in and we&apos;ll be in touch about current and
          upcoming campaigns.
        </p>

        <Button
          size="lg"
          nativeButton={false}
          render={<Link href={CAMPAIGN_FORM_URL} target="_blank" rel="noopener noreferrer" />}
          className="btn-sticker mt-8"
        >
          Open the signup form →
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">Opens in a new tab</p>
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
