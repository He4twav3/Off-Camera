/**
 * The admin menu, in one place. Pure data (no React) so a test can check that
 * every admin page is reachable from it.
 *
 * Money pages depend on how payments work (lib/direct-pay.ts): with direct
 * payment there are statements to issue; with PAYMENT_MODE=platform there are
 * payouts and withdrawals.
 */
export type AdminIcon =
  | "overview"
  | "applications"
  | "creators"
  | "brands"
  | "jobs"
  | "signups"
  | "statements"
  | "fees"
  | "payouts"
  | "withdrawals"
  | "security";

export type AdminNavItem = { href: string; label: string; icon: AdminIcon; blurb: string };
export type AdminNavGroup = { label: string | null; items: AdminNavItem[] };

export function adminNavGroups(directPay: boolean): AdminNavGroup[] {
  return [
    { label: null, items: [{ href: "/admin", label: "Overview", icon: "overview", blurb: "What needs you today." }] },
    {
      label: "People",
      items: [
        { href: "/admin/applications", label: "Applications", icon: "applications", blurb: "Decide which creators get which campaigns." },
        { href: "/admin/applicants", label: "Creators", icon: "creators", blurb: "Approve or reject creator profiles." },
        { href: "/admin/brands", label: "Brands", icon: "brands", blurb: "Approve brand accounts and see their campaigns." },
      ],
    },
    {
      label: "Campaigns",
      items: [
        { href: "/admin/jobs", label: "Jobs", icon: "jobs", blurb: "Create, edit and close campaigns, and set their pay terms." },
        { href: "/admin/campaigns", label: "Campaign signups", icon: "signups", blurb: "Review sign-ups and count their views." },
        { href: "/admin/review", label: "Post review", icon: "signups", blurb: "Check each post before it counts toward what a brand owes." },
      ],
    },
    {
      label: "Money",
      items: directPay
        ? [
            { href: "/admin/statements", label: "Statements", icon: "statements", blurb: "Issue statements and track who has paid." },
            { href: "/admin/fees", label: "Fees", icon: "fees", blurb: "What each brand owes us, per campaign and creator." },
          ]
        : [
            { href: "/admin/payouts", label: "Payouts", icon: "payouts", blurb: "Release creators' pay once the brand has paid." },
            { href: "/admin/withdrawals", label: "Withdrawals", icon: "withdrawals", blurb: "Pay creators' withdrawal requests." },
          ],
    },
    {
      label: "Settings",
      items: [
        { href: "/admin/security", label: "Security", icon: "security", blurb: "Two-step sign-in for your account." },
        { href: "/admin/settings", label: "Account", icon: "security", blurb: "Your account, and logging out." },
      ],
    },
  ];
}

/** Overview is exact-match only; every other item also matches its sub-pages. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
