"use server";

import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/request-url";

export type ForgotPasswordState = {
  error?: string;
  submitted?: boolean;
};

/**
 * Always returns the same "submitted" shape regardless of whether the
 * account exists — a real password-reset endpoint shouldn't let someone
 * probe which emails have accounts by watching for a different
 * response. `resetPasswordForEmail` itself already returns `{error:
 * null}` either way for exactly this reason.
 *
 * Uses Supabase's own resetPasswordForEmail (not admin.generateLink)
 * deliberately — this is the one call in the auth flow that produces a
 * PKCE-flow link compatible with the existing /auth/callback route.
 * admin.generateLink can never do that (see the merge's Phase 1 notes:
 * it always issues implicit/hash-fragment tokens, regardless of client
 * flowType), so recovery here means accepting Supabase's own default
 * email styling rather than the branded ResetPasswordEmail template —
 * same tradeoff already made for signup confirmations.
 */
export async function requestReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
  });

  return { submitted: true };
}
