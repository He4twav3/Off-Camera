/** Tests the ready-written payment emails (src/lib/payment-emails.ts). Run:  npx tsx scripts/test-payment-emails.ts */
import { brandEmail, creatorEmail, mailtoHref } from "../src/lib/payment-emails";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const item = (o = {}) => ({ creatorName: "Maria Lopez", campaign: "Getimg", amount: 332, dueAt: "2026-10-20T00:00:00Z", payTo: "https://buy.stripe.com/abc", ...o });

const one = brandEmail({ to: "sam@getimg.ai", contactName: "Sam Rivers", dashboardUrl: "https://www.oncameraugc.com/brand", items: [item()] });
t("addressed to the brand's contact by first name", one.to === "sam@getimg.ai" && one.body.startsWith("Hi Sam,"));
t("names the creator, amount, due date and link", /Maria Lopez/.test(one.body) && /\$332/.test(one.body) && /20 October 2026/.test(one.body) && one.body.includes("https://buy.stripe.com/abc"));
t("tells the brand to enter exactly the amount and mark it paid", /exactly the amount/.test(one.body) && one.body.includes("https://www.oncameraugc.com/brand"));
t("a single payment has a specific subject", one.subject === "Payment due: $332 to Maria Lopez", one.subject);

const many = brandEmail({ to: "a@b.c", contactName: "Sam", dashboardUrl: "u", items: [item(), item({ creatorName: "Leo Park", amount: 120.5, payTo: null })] });
t("several payments total up in the subject", many.subject === "Payments due: $452.50 across 2 creators", many.subject);
t("a missing link says so instead of leaving a blank", /haven't added one yet/.test(many.body));
t("each creator is listed", /Maria Lopez/.test(many.body) && /Leo Park/.test(many.body));

const c = creatorEmail({ to: "m@x.com", creatorName: "Maria Lopez", brandName: "Getimg", item: item(), earningsUrl: "https://www.oncameraugc.com/dashboard/recruiting/earnings", hasLink: true });
t("creator email says what is owed and who pays", c.subject === "$332 owed to you for Getimg" && /Getimg has been asked to pay you directly/.test(c.body));
t("and asks them to confirm when it arrives", /confirm it/.test(c.body));
t("with no link saved it asks for one", /Stripe or Wise link/.test(creatorEmail({ to: "m@x.com", creatorName: "M", brandName: null, item: item({ payTo: null }), earningsUrl: "u", hasLink: false }).body));

const href = mailtoHref(one);
t("the mail link carries the subject and body", href.startsWith("mailto:sam%40getimg.ai?subject=") && decodeURIComponent(href).includes("Pay here: https://buy.stripe.com/abc"));
t("a name never breaks the email", brandEmail({ to: "a@b.c", contactName: "", dashboardUrl: "u", items: [item()] }).body.startsWith("Hi there,"));

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
