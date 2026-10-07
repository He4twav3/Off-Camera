/**
 * Tests the admin menu and its separation from the public site. Run:
 *   npx tsx scripts/test-admin-nav.ts
 *
 * - every admin page is reachable from the menu (so none gets forgotten)
 * - every menu item points at a page that exists
 * - nothing in the admin code links to the public site or the creator area
 * - the sign-out destination can only ever be a path on this site
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { adminNavGroups, isAdminNavActive } from "../src/lib/admin-nav";
import { safeLocalPath } from "../src/lib/safe-path";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const root = join(__dirname, "..");
const adminDir = join(root, "src/app/admin");

// --- menu coverage ---------------------------------------------------------
const hrefs = new Set(
  [true, false].flatMap((direct) => adminNavGroups(direct).flatMap((g) => g.items.map((i) => i.href))),
);

// Top-level admin pages: src/app/admin/page.tsx and src/app/admin/<x>/page.tsx.
const topLevel = ["/admin"].concat(
  readdirSync(adminDir)
    .filter((d) => statSync(join(adminDir, d)).isDirectory() && existsSync(join(adminDir, d, "page.tsx")))
    .map((d) => `/admin/${d}`),
);
for (const route of topLevel) t(`${route} is in the menu`, hrefs.has(route));
for (const href of hrefs) {
  const file = href === "/admin" ? join(adminDir, "page.tsx") : join(adminDir, href.replace("/admin/", ""), "page.tsx");
  t(`menu item ${href} has a page`, existsSync(file), file);
}

// Direct payment shows statements; platform mode shows payouts and withdrawals.
const labels = (direct: boolean) => adminNavGroups(direct).flatMap((g) => g.items.map((i) => i.href));
t("direct payment: Statements, no Payouts or Withdrawals", labels(true).includes("/admin/statements") && !labels(true).includes("/admin/payouts") && !labels(true).includes("/admin/withdrawals"));
t("platform mode: Payouts and Withdrawals, no Statements", labels(false).includes("/admin/payouts") && labels(false).includes("/admin/withdrawals") && !labels(false).includes("/admin/statements"));
t("every item has a description", adminNavGroups(true).concat(adminNavGroups(false)).every((g) => g.items.every((i) => i.blurb.length > 8)));

// --- active highlighting ---------------------------------------------------
t("Overview is active only on /admin", isAdminNavActive("/admin", "/admin") && !isAdminNavActive("/admin/jobs", "/admin"));
t("a section stays active on its sub-pages", isAdminNavActive("/admin/jobs/abc/contract", "/admin/jobs"));
t("a similar prefix is not a match", !isAdminNavActive("/admin/jobsite", "/admin/jobs"));

// --- detachment: no links out of admin ---------------------------------------
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|ts)$/.test(f) ? [p] : [];
  });
}
const adminFiles = [...walk(adminDir), ...walk(join(root, "src/components/admin"))];
const outward = /href=\{?["'`]\/(?!admin\b)|href: ["']\/(?!admin\b)|<Logo\b|components\/site\/logo|redirect\(["']\/(?!admin|login)/;
for (const f of adminFiles) {
  const src = readFileSync(f, "utf8");
  const hit = src.split("\n").findIndex((line) => outward.test(line));
  t(`${relative(root, f)} has no link to the public site`, hit === -1, hit === -1 ? "" : `line ${hit + 1}: ${src.split("\n")[hit].trim()}`);
}

// --- safe sign-out destination ---------------------------------------------
t("a path on this site is allowed", safeLocalPath("/login", "/") === "/login");
t("another site is refused", safeLocalPath("https://evil.example", "/") === "/");
t("a protocol-relative URL is refused", safeLocalPath("//evil.example", "/") === "/");
t("a backslash trick is refused", safeLocalPath("/\\evil.example", "/") === "/");
t("control characters are refused", safeLocalPath("/login\n//evil", "/") === "/");
t("a missing value falls back", safeLocalPath(null, "/x") === "/x" && safeLocalPath(undefined, "/x") === "/x");
t("a non-string value falls back", safeLocalPath(42, "/x") === "/x");

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
