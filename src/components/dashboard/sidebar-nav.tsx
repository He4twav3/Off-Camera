"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Briefcase, Search, UserCircle, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const COURSE_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/account", label: "Account", icon: Settings },
];

const RECRUITING_ITEMS = [
  { href: "/dashboard/recruiting", label: "Recruiting home", icon: Briefcase, countKey: "applications" as const },
  { href: "/dashboard/recruiting/jobs", label: "Browse jobs", icon: Search, countKey: null },
  { href: "/dashboard/recruiting/profile-setup", label: "My profile", icon: UserCircle, countKey: null },
];

// "/dashboard" and "/dashboard/recruiting" are each an index route with
// their own sibling items nested underneath in this same nav (Account;
// Browse jobs/My profile) — prefix-matching either would also light up
// while viewing one of those siblings, so they need exact matches only.
// Nothing else here has that shape, so plain prefix matching is correct
// for the rest (e.g. "Browse jobs" should stay active on a job's own
// detail page, which isn't a nav item of its own).
const EXACT_ONLY = new Set(["/dashboard", "/dashboard/recruiting"]);

function isActive(pathname: string, href: string) {
  if (EXACT_ONLY.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {!!count && (
        <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SidebarNav({
  courseComplete,
  recruitingCounts,
  isAdmin,
}: {
  courseComplete: boolean;
  recruitingCounts: { applications: number; campaigns: number };
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div>
        <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Course
        </p>
        <div className="flex flex-col gap-0.5">
          {COURSE_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Recruiting
        </p>
        {courseComplete ? (
          <div className="flex flex-col gap-0.5">
            {RECRUITING_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={isActive(pathname, item.href)}
                count={item.countKey ? recruitingCounts[item.countKey] : undefined}
              />
            ))}
          </div>
        ) : (
          // Not a dead end — just not a Link, since there's nowhere useful
          // to land yet (the route itself would only bounce back to
          // /dashboard). Matches the same fact dashboard/recruiting/layout.tsx
          // gates on, so this can never show "unlocked" when the route
          // itself would disagree.
          <div className="rounded-lg border border-dashed border-border px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              Locked for now
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Finish every lesson to unlock campaigns and brand deals.
            </p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div>
          <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Admin
          </p>
          <NavLink href="/admin" label="Admin panel" icon={ShieldCheck} active={false} />
        </div>
      )}
    </nav>
  );
}
