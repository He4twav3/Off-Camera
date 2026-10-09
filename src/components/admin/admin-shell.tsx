import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { AdminMobileMenu, AdminNav, AdminSignOut } from "@/components/admin/admin-nav";
import type { AdminNavGroup } from "@/lib/admin-nav";

/**
 * The admin frame. Deliberately has no link to the public site or to the
 * creator dashboard: the brand block is not a link, and signing out returns to
 * the login page. Admin is its own place, not a corner of the main site.
 */
function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="size-6" />
      <span className="font-heading text-base font-semibold text-foreground">OnCamera</span>
      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Admin</span>
    </div>
  );
}

export function AdminShell({
  groups,
  email,
  badges = {},
  children,
}: {
  groups: AdminNavGroup[];
  email: string;
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  return (
    // relative z-10: the site draws a fixed dark vignette (dark-invert.css) that would
    // otherwise paint over the page and dim text near the bottom of the screen.
    <div className="app-ui relative z-10 flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-border/70 bg-card lg:block">
        <div className="flex min-h-full flex-col px-3 py-4">
          <div className="px-3 pb-5">
            <Brand />
          </div>
          <div className="flex-1">
            <AdminNav groups={groups} badges={badges} />
          </div>
          <div className="border-t border-border pt-3">
            <p className="truncate px-3 text-xs text-muted-foreground">{email}</p>
            <AdminSignOut />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-card px-4 py-3 lg:hidden">
          <Brand />
          <AdminMobileMenu groups={groups} email={email} badges={badges} />
        </header>
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
