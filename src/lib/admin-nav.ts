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

/**
 * The menu, by what you do. Campaigns is the home page: each campaign opens to its own page with its
 * creators. A number beside an item means that many things there are waiting on you (see
 * lib/admin-badges.ts). `hide` leaves out older pages that have nothing in them.
 */
export function adminNavGroups(directPay: boolean, hide: string[] = []): AdminNavGroup[] {
  const groups: AdminNavGroup[] = [
    { label: null, items: [{ href: "/admin", label: "Campaigns", icon: "jobs", blurb: "Every campaign. Open one to see its creators, views and money, and to edit its pay terms." }] },
    {
      label: "People",
      items: [
        { href: "/admin/brands", label: "Brands", icon: "brands", blurb: "Approve new brands. Delete ones you don't want." },
        { href: "/admin/applicants", label: "Creators", icon: "creators", blurb: "Approve or reject new creators." },
        { href: "/admin/applications", label: "Applications", icon: "applications", blurb: "Applications to campaigns that ask for a sample video: accept or decline." },
        { href: "/admin/campaigns", label: "Campaign signups", icon: "signups", blurb: "Older campaign sign-ups to review and count." },
      ],
    },
    {
      label: "Videos",
      items: [{ href: "/admin/review", label: "Post review", icon: "signups", blurb: "Check each video before it counts toward what a brand owes." }],
    },
    {
      label: "Money",
      items: directPay
        ? [
            { href: "/admin/statements", label: "Payments", icon: "statements", blurb: "Issue a payment when one is due, mark it paid, and see our fee on each." },
            { href: "/admin/payout-details", label: "Payout details", icon: "payouts", blurb: "The emails to send, already written: one for each creator and brand." },
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
        { href: "/admin/cleanup", label: "Clean up", icon: "security", blurb: "Delete test accounts and placeholder campaigns. Admins and Getimg are kept." },
        { href: "/admin/settings", label: "Account", icon: "security", blurb: "Your account, and logging out." },
      ],
    },
  ];
  return groups.map((g) => ({ ...g, items: g.items.filter((i) => !hide.includes(i.href)) })).filter((g) => g.items.length > 0);
}

/** Overview is exact-match only; every other item also matches its sub-pages. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
