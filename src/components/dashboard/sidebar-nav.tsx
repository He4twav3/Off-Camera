"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Briefcase, Search, UserCircle, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const COURSE_ITEMS = [{ href: "/dashboard", label: "Course", icon: LayoutDashboard }];

const ACCOUNT_ITEMS = [{ href: "/dashboard/account", label: "Account", icon: Settings }];

const RECRUITING_ITEMS = [
  { href: "/dashboard/recruiting", label: "Recruiting home", icon: Briefcase, countKey: "applications" as const },
  { href: "/dashboard/recruiting/jobs", label: "Browse jobs", icon: Search, countKey: null },
  { href: "/dashboard/recruiting/earnings", label: "Earnings", icon: Wallet, countKey: null },
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
  recruitingCounts,
  isAdmin,
}: {
  recruitingCounts: { applications: number; campaigns: number };
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      <div>
        <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Recruiting
        </p>
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
      </div>

      {/* The course is optional: nothing in Recruiting waits on it. */}
      <div>
        <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Course <span className="font-normal normal-case">· optional</span>
        </p>
        <div className="flex flex-col gap-0.5">
          {COURSE_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {ACCOUNT_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
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
