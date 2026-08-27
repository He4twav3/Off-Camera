import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { CountdownBadge } from "@/components/marketing/countdown-badge";
import { SignupForm } from "./signup-form";
import { siteConfig } from "@/lib/site-config";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Save Your Spot",
  description:
    "Get the first 5 days of Off Camera free — real lessons from the course, no card required.",
  alternates: { canonical: "/signup" },
};

/**
 * Real signup — creates a real, passwordless account via saveSpot
 * (actions.ts) and emails a magic sign-in link, same underlying
 * mechanism the paid-purchase flow uses (lib/fulfillment.ts), just
 * without a payment attached. This page's only job is the capture
 * itself. No pitch, no proof section, no curriculum list — anyone here
 * already saw all of that on the homepage.
 *
 * Free for a real, bounded 5-day window — the countdown (see
 * hero.tsx's own copy of it) is the site's actual urgency mechanic,
 * genuinely per-visitor, not a fake deadline.
 */
export default function SignupPage() {
  return (
    <div className="dark-invert flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Back to the main site
        </Link>
      </header>

      <main className="ember-glow flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm text-center">
          <CountdownBadge />

          <h1 className="text-sticker mt-6 text-3xl font-semibold tracking-tight">
            Get your first 5 days free.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Real lessons from the course — hooks, retention, and the
            mechanics behind our real videos.
          </p>

          <SignupForm />

          <p className="mt-4 text-xs text-muted-foreground">
            One link, sent once. No spam, no card required.
          </p>

          <div className="mt-8 border-t border-border pt-5 text-left text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">What happens next</p>
            <p className="mt-1.5">
              You&apos;ll get one email with a sign-in link. Open it and
              you&apos;re straight into your first 5 days, free.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/70 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/" className="hover:text-foreground">Back to the main site →</Link>
        </div>
        <p className="mt-3">© 2026 {siteConfig.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
