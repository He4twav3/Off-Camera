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
 * The menu follows the work, in the order it happens: onboard brands and set up their campaigns,
 * look after the creators and their videos, then the money. A number beside an item means that
 * many things there are waiting on you (see lib/admin-badges.ts). `hide` leaves out older pages
 * that have nothing in them.
 */
export function adminNavGroups(directPay: boolean, hide: string[] = []): AdminNavGroup[] {
  const groups: AdminNavGroup[] = [
    { label: null, items: [{ href: "/admin", label: "Overview", icon: "overview", blurb: "Every campaign, its creators, their views and earnings, my earnings, and payouts." }] },
    {
      label: "1 · Brands and campaigns",
      items: [
        { href: "/admin/brands", label: "Brands", icon: "brands", blurb: "Approve new brands. Delete ones you don't want." },
        { href: "/admin/jobs", label: "Campaigns", icon: "jobs", blurb: "Create campaigns, attach a brand, set the pay terms, and see each campaign's creators." },
        { href: "/admin/campaigns", label: "Campaign signups", icon: "signups", blurb: "Older campaign sign-ups to review and count." },
      ],
    },
    {
      label: "2 · Creators and videos",
      items: [
        { href: "/admin/applicants", label: "Creators", icon: "creators", blurb: "Approve or reject new creators." },
        { href: "/admin/applications", label: "Applications", icon: "applications", blurb: "Applications to campaigns that ask for a sample video: accept or decline." },
        { href: "/admin/review", label: "Post review", icon: "signups", blurb: "Check each video before it counts toward what a brand owes." },
      ],
    },
    {
      label: "3 · Money",
      items: directPay
        ? [
            { href: "/admin/statements", label: "Statements", icon: "statements", blurb: "Issue what a brand owes a creator, and track who has paid." },
            { href: "/admin/fees", label: "Fees", icon: "fees", blurb: "Our fee on each statement: what each brand owes us, and what has arrived." },
            { href: "/admin/payout-details", label: "Payout details", icon: "payouts", blurb: "Each creator's email and payment link, to copy or open." },
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
  return groups.map((g) => ({ ...g, items: g.items.filter((i) => !hide.includes(i.href)) })).filter((g) => g.items.length > 0);
}

/** Overview is exact-match only; every other item also matches its sub-pages. */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
