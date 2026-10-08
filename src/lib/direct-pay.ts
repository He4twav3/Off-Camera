/**
 * Direct payment: the brand pays each creator itself and the platform only
 * keeps the statement. Pure helpers (no server imports) so they are easy to
 * test and safe to use from client components.
 *
 * PAYMENT_MODE=platform switches the older balance-and-withdrawal system back
 * on (for when there is a legal entity to hold funds). Anything else, or
 * unset, means direct payment.
 */

export function isDirectPay(): boolean {
  return process.env.PAYMENT_MODE !== "platform";
}

/** Days a brand has to pay once a statement is issued. */
export const STATEMENT_DUE_DAYS = 14;

export type StatementState =
  | "awaiting_payment" // issued, brand hasn't said it paid, not yet due
  | "overdue" // issued, not marked paid, past the due date
  | "brand_says_paid" // brand marked it paid, creator hasn't confirmed yet
  | "confirmed" // creator confirmed receipt: done
  | "disputed"; // creator says they weren't paid

export type StatementLike = {
  due_at: string;
  brand_paid_at: string | null;
  creator_confirmed_at: string | null;
  creator_disputed_at: string | null;
};

/** One state per statement. The creator's word outranks the brand's. */
export function statementState(s: StatementLike, now: Date = new Date()): StatementState {
  if (s.creator_confirmed_at) return "confirmed";
  if (s.creator_disputed_at) return "disputed";
  if (s.brand_paid_at) return "brand_says_paid";
  return new Date(s.due_at).getTime() < now.getTime() ? "overdue" : "awaiting_payment";
}

export const STATE_LABEL: Record<StatementState, string> = {
  awaiting_payment: "Waiting for the brand to pay",
  overdue: "Overdue",
  brand_says_paid: "Brand says it paid. Please confirm",
  confirmed: "Paid",
  disputed: "Reported as not paid",
};

export function dueDateFrom(issued: Date, days: number = STATEMENT_DUE_DAYS): Date {
  return new Date(issued.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Payment methods a brand can say it used. */
export const BRAND_METHODS = ["Card (Stripe link)", "Wise", "Bank transfer", "PayPal", "Other"] as const;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** True when the text contains something that looks like a payment card number. */
export function looksLikeCardNumber(text: string): boolean {
  // An IBAN (two letters, two check digits, then groups) is welcome here and
  // its long digit runs could pass the card check by chance, so skip those.
  const withoutIbans = text.replace(/\b[A-Za-z]{2}\d{2}(?: ?[A-Za-z0-9]{1,4}){3,8}\b/g, " ");
  // Runs of digits separated by single spaces or dashes, e.g. 4242 4242 4242 4242.
  const runs = withoutIbans.match(/\d(?:[ -]?\d){12,18}/g) ?? [];
  return runs.some((run) => {
    const digits = run.replace(/[ -]/g, "");
    return digits.length >= 13 && digits.length <= 19 && luhnValid(digits);
  });
}

export type InstructionsResult = { ok: true; value: string } | { ok: false; error: string };

/** Validates what a creator types for "how should the brand pay me". */
export function parsePayoutInstructions(raw: string): InstructionsResult {
  const value = raw.trim().replace(/\s+/g, " ");
  if (value.length < 5) return { ok: false, error: "Add how the brand should pay you, e.g. your PayPal or Wise email, or your IBAN." };
  if (value.length > 200) return { ok: false, error: "Keep it under 200 characters." };
  if (looksLikeCardNumber(value)) {
    return { ok: false, error: "That looks like a card number. Please don't share one. Use your IBAN, or the email on your PayPal or Wise." };
  }
  return { ok: true, value };
}
