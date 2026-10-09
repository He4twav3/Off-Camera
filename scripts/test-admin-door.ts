/** Tests the hidden admin door (src/lib/admin-door.ts). Run:  npx tsx scripts/test-admin-door.ts */
import { doorDecision, doorPath } from "../src/lib/admin-door";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const door = "/hq-secret";

t("no door configured: nothing changes", doorDecision({ path: "/admin", cookie: undefined, door: null }) === "pass");
t("without the cookie /admin is blocked", doorDecision({ path: "/admin", cookie: undefined, door }) === "block");
t("and so is every page under it", doorDecision({ path: "/admin/jobs", cookie: undefined, door }) === "block");
t("a wrong cookie does not open it", doorDecision({ path: "/admin", cookie: "/nope", door }) === "block");
t("with the cookie /admin works", doorDecision({ path: "/admin/jobs", cookie: door, door }) === "pass");
t("the secret address opens the door", doorDecision({ path: door, cookie: undefined, door }) === "open");
t("with a trailing slash, dot or capitals too", ["/hq-secret/", "/hq-secret.", "/HQ-Secret", "/hq-secret)"].every((path) => doorDecision({ path, cookie: undefined, door }) === "open"));
t("other pages are untouched", doorDecision({ path: "/brand", cookie: undefined, door }) === "pass" && doorDecision({ path: "/login", cookie: undefined, door }) === "pass");
t("a page that only starts with the word admin is untouched", doorDecision({ path: "/administrator", cookie: undefined, door }) === "pass");
t("off outside the live site", doorPath({}) === null && doorPath({ VERCEL_ENV: "preview" }) === null);
t("on in production", doorPath({ VERCEL_ENV: "production" }) === "/hq-onyx-falcon-meadow-4821");
t("a variable overrides it", doorPath({ ADMIN_DOOR_PATH: "my-door", VERCEL_ENV: "production" }) === "/my-door" && doorPath({ ADMIN_DOOR_PATH: "/x1" }) === "/x1");

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
