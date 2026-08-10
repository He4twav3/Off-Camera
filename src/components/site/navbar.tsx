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
import { SiteSearch } from "@/components/site/site-search";
import { MetalButtonWrap } from "@/components/site/metal-button-wrap";
import { cn } from "@/lib/utils";

const pages = [
  { href: "/", label: "Home" },
  { href: "/course", label: "The Course" },
  { href: "/dashboard", label: "Dashboard" },
];

// Real in-page jumps, not decoration — both marketing pages define matching
// section ids, so these work identically from "/" or "/course". Each gets
// its own flat color, the one place on the site allowed to be as varied as
// Gumroad's actual category dropdowns.
const sections = [
  { href: "#curriculum", label: "Curriculum", color: "bg-menu-1" },
  { href: "#story", label: "Story", color: "bg-menu-2" },
  { href: "#reviews", label: "Reviews", color: "bg-menu-3" },
  { href: "#pricing", label: "Pricing", color: "bg-menu-4" },
  { href: "#faq", label: "FAQ", color: "bg-menu-5" },
];

// Deliberately not async / no getSession() call here: this navbar is shared
// by every marketing page, and reading the session cookie in a server
// component forces the whole page tree to render dynamically, which would
// quietly drop static generation site-wide for a login pill. AuthNavPill /
// AuthNavRow are client components that fetch real session state from
// /api/session after hydration instead, so the marketing pages stay static.
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <SiteSearch variant="bar" />

        <nav className="ml-auto hidden items-center gap-2.5 lg:flex">
          {pages.slice(1).map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="pill-outline rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              {page.label}
            </Link>
          ))}
          <AuthNavPill />
        </nav>

        {/* Visibility lives on this plain wrapper, not on MetalButtonWrap's
            own className: metal-fx injects its own runtime stylesheet with
            `.metal-fx-root { display: inline-flex }`, appended to <head>
            after Tailwind's, which wins the specificity tie against
            Tailwind's `.hidden` utility when applied directly to that same
            root element -- the button silently stayed visible on mobile.
            A wrapper metal-fx never targets has no such conflict. */}
        <div className="ml-auto hidden lg:inline-flex">
          <MetalButtonWrap>
            <Button
              nativeButton={false}
              render={<Link href="/course#pricing" />}
              className="btn-sticker"
            >
              Enroll now
            </Button>
          </MetalButtonWrap>
        </div>

        <Sheet>
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
            <nav className="flex flex-col gap-2 px-4">
              <SiteSearch variant="row" />
              <div className="my-1 border-t border-border" />
              {pages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="pill-outline rounded-full bg-card px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  {page.label}
                </Link>
              ))}
              <div className="my-1 border-t border-border" />
              {sections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className={cn(
                    "pill-outline rounded-full px-3.5 py-2 text-sm font-semibold text-menu-foreground",
                    section.color
                  )}
                >
                  {section.label}
                </Link>
              ))}
              <Button
                nativeButton={false}
                render={<Link href="/course#pricing" />}
                className="btn-sticker mt-3"
              >
                Enroll now
              </Button>
              <div className="my-1 border-t border-border" />
              <AuthNavRow />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Hidden below lg: this row lives inside the sticky header, so on a
          phone it would permanently occupy header height at every scroll
          position, cut off mid-label with no scroll affordance, and it's
          already fully duplicated by the section links in the hamburger
          sheet above. Desktop keeps it unchanged. */}
      <div className="no-scrollbar hidden overflow-x-auto border-t border-border/70 bg-secondary/40 lg:block">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2.5 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "pill-outline shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-menu-foreground transition-transform hover:-translate-y-0.5",
                section.color
              )}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
