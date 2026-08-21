"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  PaperPlaneTilt,
  Briefcase,
  UserCircle,
  GearSix,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface NavCounts {
  applications: number;
  campaigns: number;
}

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour, countKey: null },
  { href: "/jobs", label: "Browse jobs", icon: Briefcase, countKey: null },
  {
    href: "/dashboard#applications",
    label: "Applications",
    icon: PaperPlaneTilt,
    countKey: "applications" as const,
  },
  { href: "/profile-setup", label: "My profile", icon: UserCircle, countKey: null },
  { href: "/account", label: "Settings", icon: GearSix, countKey: null },
];

export function AppNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        // Anchor links share the dashboard path, so only the bare /dashboard
        // entry should light up on it.
        const active =
          item.href === pathname ||
          (item.href.includes("#") === false && pathname.startsWith(item.href) && item.href !== "/dashboard") ||
          (item.href === "/dashboard" && pathname === "/dashboard");

        const count = item.countKey ? counts[item.countKey] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-[15px] font-semibold",
              "transition-colors duration-200",
              active
                ? "bg-accent-tint text-accent-ink"
                : "text-foreground hover:bg-background-alt",
            )}
          >
            <Icon size={20} weight="regular" className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            {count > 0 && (
              <span className="min-w-6 rounded-full bg-primary px-2 py-0.5 text-center text-xs font-semibold text-on-primary tabular-nums">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom bar on mobile — five targets max, per the nav guidelines. */
export function AppNavMobile({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Home", icon: SquaresFour, count: 0 },
    { href: "/jobs", label: "Jobs", icon: Briefcase, count: 0 },
    {
      href: "/dashboard#applications",
      label: "Applied",
      icon: PaperPlaneTilt,
      count: counts.applications,
    },
    { href: "/profile-setup", label: "Profile", icon: UserCircle, count: 0 },
    { href: "/account", label: "Settings", icon: GearSix, count: 0 },
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href.split("#")[0] && !item.href.includes("#");
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2",
                  "text-[11px] font-semibold transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} />
                {item.label}
                {item.count > 0 && (
                  <span className="absolute right-1/2 top-1 ml-3 translate-x-4 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-on-primary tabular-nums">
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
