"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Briefcase,
  Building2,
  Coins,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Menu,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isAdminNavActive, type AdminIcon, type AdminNavGroup } from "@/lib/admin-nav";

const ICONS: Record<AdminIcon, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  applications: ClipboardList,
  creators: Users,
  brands: Building2,
  jobs: Briefcase,
  signups: Megaphone,
  statements: Receipt,
  fees: Coins,
  payouts: Banknote,
  withdrawals: Wallet,
  security: ShieldCheck,
};

/** The grouped admin menu. Used in the desktop sidebar and the phone drawer. */
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {groups.map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isAdminNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Phone and tablet: a button that opens the same menu. Closes when you pick a page. */
export function AdminMobileMenu({ groups, email }: { groups: AdminNavGroup[]; email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-muted"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-b border-border bg-card px-4 py-4 shadow-lg"
          onClick={(e) => {
            // Picking a page closes the menu.
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <AdminNav groups={groups} />
          <div className="mt-5 border-t border-border pt-4">
            <p className="truncate px-3 text-xs text-muted-foreground">{email}</p>
            <AdminSignOut />
          </div>
        </div>
      )}
    </div>
  );
}

/** Sign out and stay inside admin: lands on the login page, never the public site. */
export function AdminSignOut() {
  return (
    <form action="/auth/signout" method="post">
      <input type="hidden" name="next" value="/login" />
      <button
        type="submit"
        className="mt-1 flex min-h-10 w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
