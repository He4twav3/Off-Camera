/** Tests OnCamera's per-campaign fee (src/lib/fee.ts). Run:  npx tsx scripts/test-fee.ts */
import { describeFee, feeForPayment, feeTotal, parseFeeRows } from "../src/lib/fee";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};
const bands = [{ upTo: 5000, percent: 25 }, { upTo: 20000, percent: 20 }, { upTo: null, percent: 15 }];

t("a first $1,000 at 25% on top is $250", feeForPayment(0, 1000, bands) === 250, feeForPayment(0, 1000, bands));
t("$6,000 in all is 25% of 5,000 plus 20% of 1,000", feeTotal(6000, bands) === 1450, feeTotal(6000, bands));
t("a payment that crosses a band only pays the new rate on the part inside it", feeForPayment(4500, 1000, bands) === 125 + 100, feeForPayment(4500, 1000, bands));
t("a payment wholly inside a later band uses its rate", feeForPayment(10000, 1000, bands) === 200, feeForPayment(10000, 1000, bands));
t("the open band covers everything above", feeTotal(30000, bands) === 1250 + 3000 + 1500, feeTotal(30000, bands));
t("no bands means no fee", feeForPayment(0, 1000, []) === 0 && feeTotal(500, []) === 0);
t("a single flat rate", feeForPayment(0, 800, [{ upTo: null, percent: 25 }]) === 200);
t("zero pay, zero fee", feeForPayment(0, 0, bands) === 0);
t("the sum of payments equals the fee on the total", feeForPayment(0, 3000, bands) + feeForPayment(3000, 4000, bands) === feeTotal(7000, bands));
t("bands can be given in any order", feeTotal(6000, [...bands].reverse()) === 1450);
t("in words", describeFee(bands) === "25% on top up to $5,000, then 20% up to $20,000, then 15% above that", describeFee(bands));
t("a flat rate in words", describeFee([{ upTo: null, percent: 25 }]) === "25% on top");
t("nothing set in words", describeFee([]) === "No fee set");

const rows = (u: string[], p: string[]) => parseFeeRows((k) => (k === "fee_upto" ? u : p));
const ok1 = rows(["5000", "20000", ""], ["25", "20", "15"]);
t("rows parse, with a blank limit as the open band", ok1.ok && ok1.bands.length === 3 && ok1.bands[2].upTo === null, ok1);
t("blank rows are skipped", (() => { const r = rows(["", ""], ["", ""]); return r.ok && r.bands.length === 0; })());
t("a missing percentage is refused", !rows(["5000"], [""]).ok);
t("a percentage over 100 is refused", !rows(["5000"], ["120"]).ok);
t("two open bands are refused", !rows(["", ""], ["25", "20"]).ok);
t("the same limit twice is refused", !rows(["5000", "5000"], ["25", "20"]).ok);
console.log(bad ? `${bad} failed` : "all passed");
process.exit(bad ? 1 : 0);
