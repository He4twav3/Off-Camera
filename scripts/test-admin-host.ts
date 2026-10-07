/**
 * Tests the rules for serving admin on its own address (src/lib/admin-host.ts).
 * Run:  npx tsx scripts/test-admin-host.ts
 */
import { adminHostDecision, EDGE_HEADER } from "../src/lib/admin-host";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const ADMIN = "admin.example.com";
const SECRET = "s3cret-value-from-cloudflare";
// Explicit options (not default parameters): passing `undefined` to a defaulted
// parameter silently uses the default, which would make the "unset" cases below meaningless.
type Opts = { header?: string | null; secret?: string | undefined; adminHost?: string | undefined };
const decide = (host: string | null, path: string, header: string | null = SECRET, secret?: string | undefined, adminHost?: string | undefined) =>
  adminHostDecision({ host, path, adminHost: adminHost ?? ADMIN, edgeHeader: header, edgeSecret: secret === undefined ? SECRET : secret });
const decideWith = (host: string | null, path: string, o: Opts) =>
  adminHostDecision({ host, path, adminHost: o.adminHost, edgeHeader: o.header ?? null, edgeSecret: o.secret });
const is = (d: ReturnType<typeof decide>, action: string) => d.action === action;

t("the header name is fixed", EDGE_HEADER === "x-oncamera-edge");

// Not configured: nothing changes anywhere (staging, previews, local).
t("ADMIN_HOST unset: /admin stays reachable", is(decideWith("localhost:3000", "/admin", { adminHost: undefined }), "allow"));
t("ADMIN_HOST empty: /admin stays reachable", is(decideWith("localhost:3000", "/admin", { adminHost: "" }), "allow"));
t("ADMIN_HOST unset: the public site is untouched", is(decideWith("www.example.com", "/", { adminHost: undefined }), "allow"));

// The public address: admin does not exist.
t("public address: /admin is a 404", is(decide("www.example.com", "/admin"), "notfound"));
t("public address: /admin/statements is a 404", is(decide("www.example.com", "/admin/statements"), "notfound"));
t("public address: the secret does not unlock it", is(decide("www.example.com", "/admin", SECRET), "notfound"));
t("public address: the landing page works", is(decide("www.example.com", "/"), "allow"));
t("public address: login works", is(decide("www.example.com", "/login"), "allow"));
t("public address: a path that only starts with admin is not admin", is(decide("www.example.com", "/administrator"), "allow"));
t("a *.vercel.app address cannot reach admin", is(decide("project-abc.vercel.app", "/admin"), "notfound"));

// The admin address.
t("admin address with the secret: /admin works", is(decide(ADMIN, "/admin"), "allow"));
t("admin address with the secret: admin sub-pages work", is(decide(ADMIN, "/admin/jobs/abc/contract"), "allow"));
t("admin address: the host's case and port are ignored", is(decide("ADMIN.Example.com:443", "/admin"), "allow"));
t("admin address: the admin sign-in page works", is(decide(ADMIN, "/admin/login"), "allow"));
t("public address: the admin sign-in page does not exist", is(decide("www.example.com", "/admin/login"), "notfound"));
t("admin address with the secret: login works", is(decide(ADMIN, "/login"), "allow"));
t("admin address with the secret: sign-out works", is(decide(ADMIN, "/auth/signout"), "allow"));
t("admin address with the secret: password reset works", is(decide(ADMIN, "/reset-password"), "allow") && is(decide(ADMIN, "/forgot-password"), "allow"));
t("admin address: / goes to /admin", (() => { const d = decide(ADMIN, "/"); return d.action === "redirect" && d.to === "/admin"; })());
t("admin address: the landing-page routes do not exist", is(decide(ADMIN, "/brands"), "notfound") && is(decide(ADMIN, "/about"), "notfound"));
t("admin address: the creator and brand areas do not exist", is(decide(ADMIN, "/dashboard"), "notfound") && is(decide(ADMIN, "/brand"), "notfound"));
t("admin address: sign-up does not exist", is(decide(ADMIN, "/create-account"), "notfound") && is(decide(ADMIN, "/team"), "notfound"));
t("admin address: the API does not exist", is(decide(ADMIN, "/api/cron/views"), "notfound"));

// Skipping Cloudflare.
t("admin address without the secret header: nothing", is(decide(ADMIN, "/admin", null), "notfound") && is(decide(ADMIN, "/login", null), "notfound"));
t("admin address with a wrong secret: nothing", is(decide(ADMIN, "/admin", "wrong"), "notfound"));
t("admin address with a nearly right secret: nothing", is(decide(ADMIN, "/admin", SECRET + "x"), "notfound") && is(decide(ADMIN, "/admin", SECRET.slice(0, -1)), "notfound"));
t("admin address with an empty header: nothing", is(decide(ADMIN, "/admin", ""), "notfound"));
t("admin address with no secret configured: nothing (fails closed)", is(decideWith(ADMIN, "/admin", { adminHost: ADMIN, header: "anything", secret: undefined }), "notfound") && is(decideWith(ADMIN, "/admin", { adminHost: ADMIN, header: "", secret: "" }), "notfound"));
t("a missing host never counts as the admin address", is(decide(null, "/admin"), "notfound"));

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
