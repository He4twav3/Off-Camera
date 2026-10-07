"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

// "Creator > Campaigns > Campaign": where you are, on every creator page.
const SECTIONS: { prefix: string; label: string }[] = [
  { prefix: "/dashboard/recruiting/jobs", label: "Campaigns" },
  { prefix: "/dashboard/recruiting/submissions", label: "Submissions" },
  { prefix: "/dashboard/recruiting/earnings", label: "Earnings" },
  { prefix: "/dashboard/recruiting/profile-setup", label: "Profile" },
  { prefix: "/dashboard/account", label: "Account" },
  { prefix: "/dashboard", label: "Course" },
];

const ACCOUNT_PAGES: Record<string, string> = {
  "/dashboard/recruiting/profile-setup": "Profile",
  "/dashboard/account/accounts": "Accounts",
  "/dashboard/account/videos": "Videos",
  "/dashboard/account/payments": "Payments",
  "/dashboard/account": "Settings",
};

export function crumbsFor(
  pathname: string,
): { label: string; href?: string }[] {
  const page = ACCOUNT_PAGES[pathname];
  if (page) {
    return [
      { label: "Creator", href: "/dashboard/recruiting/jobs" },
      { label: "Account", href: "/dashboard/recruiting/profile-setup" },
      { label: page },
    ];
  }
  const section = SECTIONS.find(
    (s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`),
  );
  if (!section) return [{ label: "Creator" }];
  const crumbs: { label: string; href?: string }[] = [
    { label: "Creator", href: "/dashboard/recruiting/jobs" },
  ];
  // A single campaign sits one level under Campaigns.
  if (
    section.prefix === "/dashboard/recruiting/jobs" &&
    pathname !== section.prefix
  ) {
    crumbs.push(
      { label: section.label, href: section.prefix },
      { label: "Campaign" },
    );
  } else {
    crumbs.push({ label: section.label });
  }
  return crumbs;
}

export function Breadcrumb({ pathname }: { pathname?: string }) {
  const real = usePathname();
  const crumbs = crumbsFor(pathname ?? real);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {crumbs.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {i > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground/70" />
          )}
          {c.href && i < crumbs.length - 1 ? (
            <Link
              href={c.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {c.label}
            </Link>
          ) : (
            <span
              className={
                i === crumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
