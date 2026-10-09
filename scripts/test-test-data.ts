/** Tests the test-data spotting (src/lib/test-data.ts). Run:  npx tsx scripts/test-test-data.ts */
import { looksLikeTestEmail, looksLikeTestName } from "../src/lib/test-data";

let bad = 0;
const t = (n: string, ok: boolean) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n);
};
t("our own test domain", looksLikeTestEmail("test.brand@oncamera.test"));
t("example.com", looksLikeTestEmail("someone@example.com"));
t("a test local part", looksLikeTestEmail("test.creator@gmail.com") && looksLikeTestEmail("tester_1@gmail.com"));
t("a plus tag used in testing", looksLikeTestEmail("signup.tester+oc1@gmail.com"));
t("a real address is left alone", !looksLikeTestEmail("maria.lopez@gmail.com") && !looksLikeTestEmail("sam@getimg.ai"));
t("a name that merely contains 'test' inside a word is left alone", !looksLikeTestEmail("contestwinner@gmail.com"));
t("staging in a title", looksLikeTestName("Staging test campaign"));
t("placeholder and sample", looksLikeTestName("Sample campaign") && looksLikeTestName("Placeholder niche"));
t("real titles are left alone", !looksLikeTestName("Getimg") && !looksLikeTestName("Tech") && !looksLikeTestName("Product testing tips"));
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
