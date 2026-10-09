/** Tests the brand approvals digest (src/lib/brand-digest.ts). Run:  npx tsx scripts/test-brand-digest.ts */
import { digest } from "../src/lib/brand-digest";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const url = "https://www.oncameraugc.com/brand/approvals";
t("nothing waiting sends nothing", digest({ contactName: "Sam", items: [{ campaign: "Getimg", count: 0 }], url }) === null);
const one = digest({ contactName: "Sam Rivers", items: [{ campaign: "Getimg", count: 1 }], url })!;
t("one video reads naturally", one.subject === "1 video is waiting for your approval" && one.text.startsWith("Hi Sam,"), one);
const two = digest({ contactName: "", items: [{ campaign: "A", count: 2 }, { campaign: "B", count: 3 }], url })!;
t("totals across campaigns", two.subject === "5 videos are waiting for your approval" && two.text.includes("- B: 3 videos are waiting"), two);
t("blank name falls back", two.text.startsWith("Hi there,"));
t("links to Approvals", two.text.includes(url));
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
