import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarAccount } from "@/components/dashboard/sidebar-account";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { getShellData } from "@/lib/shell-data";

export const metadata: Metadata = {
  title: "Dashboard",
  // Logged-in app area, not a marketing page — keep it out of search results.
  robots: { index: false, follow: false },
};

/**
 * One shell for the whole signed-in product, course and recruiting alike —
 * this used to be a bare topbar wrapping only the course pages, with
 * recruiting getting its own separate placeholder nav one level down
 * (dashboard/recruiting/layout.tsx). Folding them together is the point:
 * the same account, the same sidebar, recruiting just a section of it that
 * unlocks in place rather than a second app bolted on beside it.
 *
 * Calm dashboard tokens throughout (border-border, bg-card, no hard-shadow
 * "sticker" treatment) — that language is reserved for the marketing
 * storefront on purpose, see globals.css's own note on it.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await getShellData();
  // proxy.ts already guarantees a session exists for anything under
  // /dashboard — this fallback is defensive, not expected to render.
  const session = shell.session ?? { displayName: "Student", email: "student@example.com", initials: "ST" };

  return (
    <div className="flex min-h-full flex-1 bg-secondary/30">
      {/* ---- Sidebar (desktop) ---- */}
      {/* overflow-y-auto on the outer rail, not just the nav — so if content
          ever runs taller than the viewport, the whole rail scrolls instead
          of silently clipping the account block pinned at its foot. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-border/70 bg-card lg:block">
        <div className="flex min-h-full flex-col px-3 py-4">
          <div className="px-3 pb-4">
            <Logo />
          </div>
          <div className="flex-1">
            <SidebarNav
              courseComplete={shell.courseComplete}
              recruitingCounts={shell.recruiting}
              isAdmin={shell.isAdmin}
            />
          </div>
          <SidebarAccount displayName={session.displayName} email={session.email} initials={session.initials} />
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact top bar, mobile only — the sidebar covers desktop. */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <MobileNav shell={shell} />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
