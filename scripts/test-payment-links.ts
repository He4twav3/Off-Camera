/** Tests the payment link rules (src/lib/payment-links.ts). Run:  npx tsx scripts/test-payment-links.ts */
import { parsePaymentLink, providerOfLink } from "../src/lib/payment-links";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const ok = (u: string) => parsePaymentLink(u);

t("stripe payment link", ok("https://buy.stripe.com/abc123XYZ").ok && providerOfLink("https://buy.stripe.com/abc123XYZ") === "stripe");
t("paypal.me link", providerOfLink("https://www.paypal.me/maria") === "paypal" && providerOfLink("https://paypal.me/maria") === "paypal");
t("wise link", providerOfLink("https://wise.com/pay/me/maria") === "wise" && providerOfLink("https://wise.me/maria") === "wise");
t("an email is not a link", !ok("maria@example.com").ok);
t("http (not https) is refused", !ok("http://buy.stripe.com/abc123").ok);
t("another site is refused", !ok("https://evil.example.com/pay").ok);
t("a look-alike host is refused", !ok("https://buy.stripe.com.evil.com/x").ok && !ok("https://paypal.me.evil.com/x").ok);
t("credentials in the link are refused", !ok("https://user:pw@buy.stripe.com/abc123").ok);
t("javascript: is refused", !ok("javascript:alert(1)").ok && providerOfLink("javascript:alert(1)") === null);
t("empty / null have no provider", providerOfLink("") === null && providerOfLink(null) === null);
t("trims spaces", ok("  https://buy.stripe.com/abc123  ").ok);

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
