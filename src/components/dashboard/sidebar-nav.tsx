"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Briefcase, UserCircle, Send, Wallet, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// One short, flat list: what a creator does, in the order they do it. No section
// headings and no admin link (admins have their own sign-in and panel).
const MAIN_ITEMS = [
  { href: "/dashboard/recruiting", label: "Home", icon: LayoutDashboard, countKey: "applications" as const },
  { href: "/dashboard/recruiting/jobs", label: "Campaigns", icon: Briefcase, countKey: null },
  { href: "/dashboard/recruiting/submissions", label: "Submissions", icon: Send, countKey: null },
  { href: "/dashboard/recruiting/earnings", label: "Earnings", icon: Wallet, countKey: null },
  { href: "/dashboard/recruiting/profile-setup", label: "Profile", icon: UserCircle, countKey: null },
];

// Quieter, set apart at the bottom. The course is optional: nothing waits on it.
const SECONDARY_ITEMS = [
  { href: "/dashboard", label: "Course (optional)", icon: GraduationCap },
  { href: "/dashboard/account", label: "Account", icon: Settings },
];

// "/dashboard" and "/dashboard/recruiting" are each an index route with sibling
// items beneath them in this same nav, so prefix-matching either would also light
// up while viewing a sibling: they match exactly. Everything else matches by
// prefix, so "Campaigns" stays active on a single campaign's page.
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
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

export function SidebarNav({ recruitingCounts }: { recruitingCounts: { applications: number; campaigns: number } }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-8">
      <div className="flex flex-col gap-0.5">
        {MAIN_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            count={item.countKey ? recruitingCounts[item.countKey] : undefined}
          />
        ))}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border/70 pt-4">
        {SECONDARY_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </div>
    </nav>
  );
}
