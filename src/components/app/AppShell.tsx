import type { ReactNode } from "react";
import Link from "next/link";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { AppNav, AppNavMobile, type NavCounts } from "./AppNav";

interface AppShellProps {
  children: ReactNode;
  counts: NavCounts;
  user: { name: string; handle: string | null };
  isAdmin: boolean;
}

/**
 * The signed-in chrome. Deliberately a different register from the marketing
 * site: persistent sidebar instead of a top nav, no marketing footer, a denser
 * canvas. Logging in should feel like arriving somewhere else, not like the
 * same page with different words.
 *
 * Layout patterns here (sidebar + counts, bottom bar on mobile, avatar block
 * at the foot of the rail) are the standard vocabulary of this kind of
 * product. The palette and type stay ours.
 */
export function AppShell({ children, counts, user, isAdmin }: AppShellProps) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background-alt">
      {/* ---- Sidebar (desktop) ---- */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="px-5 py-5">
          <Link
            href="/"
            className="font-heading text-lg font-semibold text-foreground transition-colors duration-200 hover:text-primary"
          >
            Creator<span className="text-primary">Roster</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <AppNav counts={counts} />

          {isAdmin && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Admin
              </p>
              <Link
                href="/admin"
                className="flex min-h-11 items-center rounded-md px-3 py-2 text-[15px] font-semibold text-foreground transition-colors duration-200 hover:bg-background-alt"
              >
                Admin panel
              </Link>
            </div>
          )}
        </div>

        {/* ---- Account block, pinned to the foot of the rail ---- */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-tint font-heading text-sm font-semibold text-accent-ink"
            >
              {initials || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {user.name}
              </span>
              {user.handle && (
                <span className="block truncate text-xs text-muted-foreground">
                  @{user.handle}
                </span>
              )}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[15px] font-semibold text-muted-foreground transition-colors duration-200 hover:bg-background-alt hover:text-foreground"
            >
              <SignOut size={20} weight="regular" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact top bar, mobile only — the sidebar covers desktop. */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 lg:hidden">
          <Link
            href="/"
            className="font-heading text-base font-semibold text-foreground"
          >
            Creator<span className="text-primary">Roster</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-primary underline underline-offset-2"
              >
                Admin
              </Link>
            )}
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-tint font-heading text-xs font-semibold text-accent-ink"
            >
              {initials || "?"}
            </span>
          </div>
        </header>

        {/* pb-20 clears the fixed mobile bottom bar. */}
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <AppNavMobile counts={counts} />
    </div>
  );
}
