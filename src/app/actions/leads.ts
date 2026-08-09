"use server";

import { saveLead } from "@/lib/leads";

export type NewsletterState = { status?: "idle" | "success" | "error"; message?: string };

/** Footer "get updates" opt-in. */
export async function subscribeToUpdates(
  _prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "");
  const result = await saveLead(email, "newsletter");
  if (!result.ok) {
    return { status: "error", message: "Enter a valid email address." };
  }
  return { status: "success", message: "You're on the list." };
}

/**
 * Fired on checkout email blur, before the buyer has committed to
 * anything — so an abandoned checkout still leaves a real lead behind
 * instead of vanishing with zero trace. Best-effort: failures are silent,
 * this must never block or interrupt someone filling out the form.
 */
export async function captureCheckoutLead(email: string) {
  try {
    await saveLead(email, "checkout_abandoned");
  } catch {
    // best-effort, ignore
  }
}
