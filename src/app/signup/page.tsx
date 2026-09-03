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
    "Your free preview window — real lessons from the course, no card required.",
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
 * Free for a real, bounded 7-day window — the countdown (see
 * hero.tsx's own copy of it) is the site's actual urgency mechanic,
 * genuinely per-visitor, not a fake deadline. It's also why the copy
 * here never promises "your first 7 days free" as a fresh grant: the
 * window starts on first VISIT (readOrStartWindow, countdown-badge.tsx),
 * not on signup, so by the time someone actually submits this form
 * there may only be hours of it left, not 7 fresh days — a badge
 * counting DOWN sitting directly under a headline promising a full 7
 * days is telling two different stories about the same number. Every
 * line on this page describes the window as already open and running
 * out, matching what the countdown right above it is visibly doing.
 *
 * ONE STATIC SCREEN, ON PURPOSE — `h-dvh overflow-hidden` on the outer
 * wrapper, not `min-h-screen`. This is a single-purpose capture page:
 * the entire job is "type an email, hit submit," and a page whose only
 * task is that shouldn't ask anyone to scroll to find the button that
 * does it. `h-dvh` over `h-screen`/`100vh` specifically because a
 * phone's browser chrome (the address bar) resizes the *visual*
 * viewport as it collapses on scroll — `100vh` is sized off the larger
 * *layout* viewport instead and quietly leaves the bottom of the page
 * behind it, under the toolbar. `overflow-hidden` is the hard
 * guarantee; getting there for real took shrinking every fixed
 * vertical cost on the page (header/footer padding, CountdownBadge's
 * digits, the spacing between every block) rather than just clipping
 * whatever didn't fit — clipping alone would have risked hiding the
 * actual email input/submit button on a short phone, which defeats the
 * page's one job worse than a scrollbar ever would.
 *
 * `overscroll-none` alongside `overflow-hidden` — a phone's rubber-band
 * bounce at the top/bottom edge is a gesture the OS/browser triggers on
 * the document itself, not something that needs real scrollable
 * overflow to fire, so `overflow-hidden` on its own doesn't stop it.
 * `overscroll-none` does, containing the gesture here instead of
 * letting it chain up to <html> — which now also carries a matching
 * dark background (see layout.tsx's own note) as a second layer under
 * that, in case it ever chains up anyway.
 */
export default function SignupPage() {
  return (
    <div className="dark-invert flex h-dvh flex-col overflow-hidden overscroll-none bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Back to the main site
        </Link>
      </header>

      <main className="ember-glow flex min-h-0 flex-1 items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm text-center">
          <CountdownBadge />

          <p className="mt-4 text-sm text-muted-foreground">
            Real lessons from the course — hooks, retention, and the
            mechanics behind our real videos.
          </p>

          <SignupForm />

          <p className="mt-3 text-xs text-muted-foreground">
            One link, sent once. No spam, no card required.
          </p>

          {/* Hidden on the shortest phones (a custom max-height variant,
              not a width one — this is the one spot on the page where
              the constraint is genuinely vertical room, not screen
              width) rather than shrunk further: at some point another
              round of smaller type stops being "compact" and starts
              being illegible, and this block is the one true optional
              in the stack — the capture form above it works completely
              without it. */}
          <div className="mt-4 hidden border-t border-border pt-3 text-left text-xs text-muted-foreground [@media(min-height:700px)]:block">
            <p className="font-semibold text-foreground">What happens next</p>
            <p className="mt-1.5">
              You&apos;ll get one email with a sign-in link. Open it and
              you&apos;re straight into the course — for whatever&apos;s
              left of your window above.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/70 px-4 py-3 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/" className="hover:text-foreground">Back to the main site →</Link>
        </div>
        <p className="mt-1.5">© 2026 {siteConfig.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
