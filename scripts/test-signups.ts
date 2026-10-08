/**
 * Tests the sign-up switch (src/lib/signups.ts). Run:  npx tsx scripts/test-signups.ts
 */
import { signupsOpen, SIGNUPS_CLOSED_MESSAGE } from "../src/lib/signups";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

delete process.env.SIGNUPS_OPEN;
t("unset means closed", !signupsOpen());
process.env.SIGNUPS_OPEN = "on";
t('exactly "on" opens it', signupsOpen());
for (const v of ["ON", "true", "1", "yes", "off", " on", "on ", ""]) {
  process.env.SIGNUPS_OPEN = v;
  t(`"${v}" does not open it`, !signupsOpen());
}
delete process.env.SIGNUPS_OPEN;
t("the closed message tells people to sign in", SIGNUPS_CLOSED_MESSAGE.toLowerCase().includes("sign in"));

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
