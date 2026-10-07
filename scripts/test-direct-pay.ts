/**
 * Tests the direct-payment rules (src/lib/direct-pay.ts): the payment-mode
 * switch, which state a statement is in, due dates, and the check that keeps
 * card numbers out of "how should brands pay me". Run:  npx tsx scripts/test-direct-pay.ts
 */
import {
  dueDateFrom,
  isDirectPay,
  looksLikeCardNumber,
  parsePayoutInstructions,
  statementState,
  STATEMENT_DUE_DAYS,
} from "../src/lib/direct-pay";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

// payment mode: direct unless explicitly switched
delete process.env.PAYMENT_MODE;
t("unset means brands pay creators directly", isDirectPay());
process.env.PAYMENT_MODE = "platform";
t("PAYMENT_MODE=platform brings balances back", !isDirectPay());
process.env.PAYMENT_MODE = "typo";
t("a typo does not switch to holding money", isDirectPay());
delete process.env.PAYMENT_MODE;

// statement state
const now = new Date("2026-10-20T12:00:00Z");
const future = "2026-10-30T00:00:00Z";
const past = "2026-10-10T00:00:00Z";
const base = { due_at: future, brand_paid_at: null, creator_confirmed_at: null, creator_disputed_at: null };
t("issued and not yet due: waiting", statementState(base, now) === "awaiting_payment");
t("not paid after the due date: overdue", statementState({ ...base, due_at: past }, now) === "overdue");
t("brand says paid: waiting for the creator", statementState({ ...base, brand_paid_at: "2026-10-15T00:00:00Z" }, now) === "brand_says_paid");
t("creator confirmed: done", statementState({ ...base, creator_confirmed_at: "2026-10-16T00:00:00Z" }, now) === "confirmed");
t("creator confirmed even though the brand never marked it", statementState({ ...base, due_at: past, creator_confirmed_at: "2026-10-16T00:00:00Z" }, now) === "confirmed");
t("creator reports not paid", statementState({ ...base, brand_paid_at: "2026-10-15T00:00:00Z", creator_disputed_at: "2026-10-18T00:00:00Z" }, now) === "disputed");
t("the creator's word outranks the brand's", statementState({ ...base, brand_paid_at: "2026-10-15T00:00:00Z", creator_confirmed_at: "2026-10-16T00:00:00Z" }, now) === "confirmed");
t("overdue and reported counts as reported", statementState({ ...base, due_at: past, creator_disputed_at: "2026-10-18T00:00:00Z" }, now) === "disputed");

// due dates
const issued = new Date("2026-10-01T00:00:00Z");
t("default due date is 14 days out", STATEMENT_DUE_DAYS === 14 && dueDateFrom(issued).toISOString() === "2026-10-15T00:00:00.000Z");
t("a custom number of days works", dueDateFrom(issued, 30).toISOString() === "2026-10-31T00:00:00.000Z");

// card numbers must not be accepted as payment details
t("a card number is caught", looksLikeCardNumber("4242 4242 4242 4242"));
t("a card number with dashes is caught", looksLikeCardNumber("card 4242-4242-4242-4242 exp 12/30"));
t("a card number with no spaces is caught", looksLikeCardNumber("4242424242424242"));
t("a 15-digit card number is caught", looksLikeCardNumber("3782 822463 10005"));
t("a Greek IBAN is not mistaken for a card", !looksLikeCardNumber("GR16 0110 1250 0000 0001 2300 695"));
t("an IBAN with no spaces is not mistaken for a card", !looksLikeCardNumber("GR1601101250000000012300695"));
t("a German IBAN is not mistaken for a card", !looksLikeCardNumber("DE89 3704 0044 0532 0130 00"));
t("a PayPal email is fine", !looksLikeCardNumber("PayPal: maria.k@example.com"));
t("a phone number is not a card", !looksLikeCardNumber("+389 70 123 456"));
t("a digit string that fails the card check passes", !looksLikeCardNumber("1234 5678 9012 3456"));

// what the creator types
t("empty is refused", !parsePayoutInstructions("  ").ok);
t("too short is refused", !parsePayoutInstructions("abc").ok);
t("too long is refused", !parsePayoutInstructions("x".repeat(201)).ok);
t("a card number is refused with a clear reason", (() => {
  const r = parsePayoutInstructions("4242 4242 4242 4242");
  return !r.ok && r.error.includes("card");
})());
t("a normal value is accepted and tidied", (() => {
  const r = parsePayoutInstructions("  Wise:   maria@example.com ");
  return r.ok && r.value === "Wise: maria@example.com";
})());
t("an IBAN is accepted", parsePayoutInstructions("GR16 0110 1250 0000 0001 2300 695").ok);

console.log(bad ? `${bad} FAILED` : "all passed");
process.exit(bad ? 1 : 0);
