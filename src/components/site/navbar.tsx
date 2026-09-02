"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { AuthNavPill, AuthNavRow } from "@/components/site/auth-nav-status";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { useScrolledPast } from "@/lib/use-scroll-y";
import { cn } from "@/lib/utils";

// Real in-page jumps, not decoration — the homepage defines all of these
// section ids (there's only one landing page now, see UX_PAGE_AUDIT.md —
// the old separate /course page that also defined them is gone). Prefixed
// with "/" rather than a bare "#...", since this Navbar is shared by every
// marketing page (/, /about, /changelog, ...), not just the homepage that
// actually has these sections — a bare hash would silently no-op from
// anywhere else. Used to be five different filled pill colors (a Gumroad-
// style category-dropdown look) — replaced with plain tracked-out text
// links, no fill, no border: a premium site's nav doesn't need five
// colors to prove five things are clickable.
const sections = [
  { href: "/#proof", label: "Proof" },
  { href: "/#curriculum", label: "Curriculum" },
  { href: "/#story", label: "Story" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

// Deliberately not async / no getSession() call here: this navbar is shared
// by every marketing page, and reading the session cookie in a server
// component forces the whole page tree to render dynamically, which would
// quietly drop static generation site-wide for a login pill. AuthNavPill /
// AuthNavRow are client components that fetch real session state from
// /api/session after hydration instead, so the marketing pages stay static.
export function Navbar() {
  // Controlled so every link inside the mobile sheet can close it on click —
  // uncontrolled, the sheet only closed via its own X button or the
  // backdrop, so tapping "Dashboard" navigated away but left the menu
  // sitting open on top of the new page underneath.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = () => setMobileNavOpen(false);

  // At the very top the navbar is transparent and the hero reads
  // full-bleed; the moment content starts passing underneath it, it
  // becomes frosted glass with a hairline under it. That transition is
  // the page telling you it's aware of where you are — a permanently
  // opaque bar reads as chrome bolted on top, and a permanently
  // transparent one leaves text scrolling through the logo.
  //
  // backdrop-blur-lg (16px), not -xl (24px) — this bar is `sticky`, so
  // that blur recomputes against whatever's scrolling underneath it on
  // essentially every frame for the entire time someone is reading the
  // page, not once. Measured under simulated mobile CPU throttling
  // (4x, roughly a mid-range phone): -xl cost ~6% more average frame
  // time scrolling past it and very nearly 3x the rate of frames
  // missing even 30fps (2.6% -> 0.9% at -lg) versus no blur at all —
  // real, felt jank on exactly the one element that's on screen for the
  // whole visit. 16px also isn't a new value invented for this: it's
  // the same radius btn-cta-glass already uses (globals.css), so the
  // page's two translucent-blur surfaces now agree with each other
  // instead of the nav quietly being the foggiest thing on it.
  const scrolled = useScrolledPast(24);

  // The mobile Sheet renders through a portal straight to document.body —
  // that used to fall outside the .dark-invert scope (a wrapper div around
  // just the homepage's own DOM subtree), so it fell back to the light
  // theme even while open on a dark page (same root cause the old search
  // dialog had before it was removed). Now that dark-invert is applied
  // sitewide directly on <body> itself (see app/layout.tsx), the portaled
  // Sheet is already inside that scope for free — no client-side class
  // juggling needed here anymore.

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-cinematic)]",
        scrolled
          ? "border-b border-hairline bg-background/80 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Save my free spot, then Log in — in that order, both pinned to
            the far right. This used to be a separate "Dashboard" pill
            (dead weight: a marketing nav pointing at a logged-in-only
            route almost nobody hitting this page has a reason to click)
            sitting ahead of the auth pill, with the CTA button as its own
            ml-auto group further right. One right-aligned group now: the
            CTA leads because it's the one action this bar exists to
            drive, and log in is what someone who already has an account
            reaches for right after it — not competing with it for first
            position. */}
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {/* "Save my free spot", not "Enroll now": we're gathering the
              free-preview list first, not pushing checkout — see
              hero.tsx's own note on the same call. Enrollment isn't
              gone, just not what this persistent, always-visible slot
              pushes right now. btn-cta-glass, not the flat btn-cta —
              same translucent-crimson-over-backdrop-blur treatment as
              every other "Save your spot" CTA now (see globals.css's
              own note on that utility): one action, one color, one
              physical treatment, everywhere it appears — not just the
              hero's own copy of it anymore. */}
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="btn-cta-glass rounded-full px-5 font-bold text-cta-foreground"
          >
            Save my free spot
          </Button>
          <AuthNavPill />
        </div>

        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto lg:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col px-4">
              {sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={closeMobileNav}
                  className="border-b border-hairline py-3 text-sm font-semibold tracking-[0.14em] text-foreground uppercase transition-colors first:pt-0 hover:text-muted-foreground"
                >
                  {section.label}
                </Link>
              ))}
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/signup" onClick={closeMobileNav} />}
                className="btn-cta-glass mt-3 rounded-full py-2.5 font-bold text-cta-foreground"
              >
                Save my free spot
              </Button>
              {/* Same order as the desktop group above: CTA leads, log
                  in trails right after it. AuthNavRow, not AuthNavPill —
                  but sized down and centered here rather than the full-
                  width bar it renders by default, so it reads as a
                  quiet secondary action under the CTA, not a second
                  button of equal weight. text-sm/py-2, not text-xs/
                  py-1.5 — same font scale as the CTA's own text-sm, just
                  less padding, so it shrinks in proportion to it rather
                  than landing at an unrelated, arbitrarily tiny size. */}
              <AuthNavRow
                onNavigate={closeMobileNav}
                className="mt-3 w-fit self-center justify-center px-6 py-2 text-sm"
              />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* A hairline progress line pinned to the bottom edge of the
          header. It answers the question a long page always raises —
          "how much of this is there?" — without a word, and it's the
          only element that moves continuously as you scroll. */}
      <ScrollProgress />

      {/* Hidden below lg: this row lives inside the sticky header, so on a
          phone it would permanently occupy header height at every scroll
          position, cut off mid-label with no scroll affordance, and it's
          already fully duplicated by the section links in the hamburger
          sheet above. Desktop keeps it unchanged. */}
      <div
        className={cn(
          "no-scrollbar hidden overflow-x-auto border-t transition-colors duration-500 lg:block",
          scrolled ? "border-hairline" : "border-transparent"
        )}
      >
        <div className="mx-auto flex max-w-[1240px] items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="focus-premium relative shrink-0 rounded text-xs font-semibold tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-crimson-bright after:transition-[width] after:duration-500 after:ease-[var(--ease-cinematic)] hover:text-foreground hover:after:w-full"
            >
              {section.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
