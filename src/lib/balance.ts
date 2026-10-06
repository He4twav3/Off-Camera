/** The smallest withdrawal a creator can request. Mirrored in request_withdrawal() (0016). */
export const MIN_WITHDRAWAL = 10;

/** Plain-language messages for the errors request_withdrawal() raises. */
export function withdrawalErrorMessage(code: string | undefined): string {
  const text = code ?? "";
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
  if (text.includes("forbidden")) return "Only admins can do that.";
  if (text.includes("not_found")) return "That request no longer exists.";
  return "Couldn't save that. Please try again.";
}

/** Money is stored to the cent; add in cents to avoid float drift. */
export function sumMoney(values: number[]): number {
  return values.reduce((cents, v) => cents + Math.round(Number(v) * 100), 0) / 100;
}
