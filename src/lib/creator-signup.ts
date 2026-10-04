import "server-only";

/**
 * Creator signup, step 1: just who they are and consent — first name, surname,
 * email + password (handled in the action) and agreement to the terms.
 * Everything else (niche, content types, handles, rates, portfolio…) is
 * collected afterwards in the profile wizard
 * (dashboard/recruiting/profile-setup), which is also where handles can be
 * added and, later, verified. Progressive, as is usual for UGC programs.
 *
 * The details are parked on the auth user's `user_metadata`; the wizard reads
 * `display_name` for its name default and `tos_accepted_at` when it creates the
 * `applicants` row.
 */

export type CreatorSignupInput = { firstName: string; lastName: string };

export function parseCreatorSignup(
  formData: FormData,
): { ok: true; value: CreatorSignupInput } | { ok: false; error: string } {
  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("last_name") ?? "").trim().slice(0, 60);
  if (!firstName) return { ok: false, error: "Enter your first name." };
  if (!lastName) return { ok: false, error: "Enter your surname." };
  if (formData.get("terms") !== "on") {
    return { ok: false, error: "Agree to the Terms and Privacy Policy to continue." };
  }
  return { ok: true, value: { firstName, lastName } };
}

/** What gets stored on the auth user while the account awaits its code. */
export function signupMetadata(input: CreatorSignupInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    display_name: `${input.firstName} ${input.lastName}`,
    tos_accepted_at: new Date().toISOString(),
  };
}
