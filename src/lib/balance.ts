/** The smallest withdrawal a creator can request. Mirrored in request_withdrawal() (0016). */
export const MIN_WITHDRAWAL = 10;

/** Limits enforced in the database (0017). Shown here so the page can explain them. */
export const DAILY_WITHDRAWAL_LIMIT = 2000;
/** From this amount, one admin approves and a different admin marks it paid. */
export const SECOND_APPROVAL_FROM = 1000;
/** Hold before a request can be paid. Longer for a first withdrawal or new payment details. */
export const HOLD_HOURS = { usual: 24, firstOrChanged: 72 } as const;

/** Plain-language messages for the errors the withdrawal functions raise. */
export function withdrawalErrorMessage(code: string | undefined): string {
  const text = code ?? "";
  if (text.includes("daily_limit")) return `You can withdraw up to $${DAILY_WITHDRAWAL_LIMIT.toLocaleString("en-US")} in 24 hours.`;
  if (text.includes("too_many")) return "That's a lot of requests in a short time. Try again in an hour.";
  if (text.includes("already_pending")) return "You have a request waiting for your email confirmation. Confirm or cancel it first.";
  if (text.includes("frozen")) return "Withdrawals are paused on your account. Please contact us.";
  if (text.includes("invalid_or_expired")) return "That confirmation link is invalid or has expired.";
  if (text.includes("below_minimum")) return `The smallest withdrawal is $${MIN_WITHDRAWAL}.`;
  if (text.includes("insufficient_balance")) return "That's more than your available balance.";
  if (text.includes("bad_details")) return "Add how we should pay you (5 to 300 characters).";
  if (text.includes("not_approved")) return "Your profile needs to be approved before you can withdraw.";
  if (text.includes("no_profile")) return "Set up your creator profile first.";
  return "We couldn't send that request. Please try again.";
}

/** Plain-language messages for the errors decide_withdrawal() raises. */
export function decisionErrorMessage(code: string | undefined): string {
  const text = code ?? "";
  if (text.includes("already_decided")) return "That request was already handled.";
  if (text.includes("already_approved")) return "That request is already approved. A different admin has to mark it paid.";
  if (text.includes("needs_second_approval")) return "Requests of $1,000 or more need one admin to approve and a different admin to mark it paid.";
  if (text.includes("on_hold")) return "This request is still in its hold period.";
  if (text.includes("frozen")) return "Withdrawals are frozen for this creator. Unfreeze them first.";
  if (text.includes("forbidden")) return "Only admins signed in with two-step verification can do that. Open Admin → Security.";
  if (text.includes("not_found")) return "That request no longer exists.";
  return "Couldn't save that. Please try again.";
}

/** Money is stored to the cent; add in cents to avoid float drift. */
export function sumMoney(values: number[]): number {
  return values.reduce((cents, v) => cents + Math.round(Number(v) * 100), 0) / 100;
}
