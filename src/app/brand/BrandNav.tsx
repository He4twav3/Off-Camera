"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, FileText, Megaphone, Menu, Settings, Users, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

// In the order a brand works: set up the campaign, approve videos, see creators, pay them.
const ITEMS = [
  { href: "/brand", label: "Campaigns", icon: Megaphone, exact: true },
  { href: "/brand/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/brand/creators", label: "Creators", icon: Users },
  { href: "/brand/payments", label: "Payments", icon: Wallet },
  { href: "/brand/templates", label: "Templates", icon: FileText },
  { href: "/brand/settings", label: "Settings", icon: Settings },
];

function active(pathname: string, href: string, exact?: boolean) {
  // Every campaign page belongs to Campaigns, which is the home.
  if (href === "/brand") return pathname === "/brand" || pathname.startsWith("/brand/campaigns");
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold tabular-nums text-primary-foreground">
      {n}
    </span>
  );
}

/** The brand's menu: a left rail on a laptop, a scrolling row on a phone. */
export function BrandNav({ variant, approvals = 0 }: { variant: "rail" | "row"; approvals?: number }) {
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
            {href === "/brand/approvals" && <Badge n={approvals} />}
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
          {href === "/brand/approvals" && <Badge n={approvals} />}
        </Link>
      ))}
    </nav>
  );
}

/** The phone menu: a hamburger button that opens the same list as the rail. Picking a page closes it. */
export function BrandMobileMenu({ approvals = 0, company }: { approvals?: number; company: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="relative flex size-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-muted"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
        {!open && approvals > 0 && <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-primary" />}
      </button>
      {open && (
        <div
          className="absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-b border-border bg-card px-3 py-3 shadow-lg"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{company}</p>
          <BrandNav variant="rail" approvals={approvals} />
        </div>
      )}
    </div>
  );
}
