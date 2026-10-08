"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/brand", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/brand/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/brand/creators", label: "Creators", icon: Users },
  { href: "/brand/payments", label: "Payments", icon: Wallet },
  { href: "/brand/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/brand/templates", label: "Templates", icon: FileText },
  { href: "/brand/settings", label: "Settings", icon: Settings },
];

function active(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** The brand's menu: a left rail on a laptop, a scrolling row on a phone. */
export function BrandNav({ variant }: { variant: "rail" | "row" }) {
  const pathname = usePathname();
  if (variant === "row") {
    return (
      <nav aria-label="Brand" className="flex gap-1 overflow-x-auto px-3 pb-2">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(pathname, href, exact) ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              active(pathname, href, exact)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Brand" className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(pathname, href, exact) ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active(pathname, href, exact)
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
