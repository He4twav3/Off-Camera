import "server-only";
import { normaliseHandle } from "@/lib/handles";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformEnum } from "@/lib/database.types";

/**
 * Creator signup data: first name, surname and a handle per platform. Collected
 * on /create-account, parked in the auth user's `user_metadata` until the
 * emailed code is confirmed (so nothing half-created lands in `applicants`),
 * then turned into the creator's real profile — an `applicants` row plus one
 * `applicant_handles` row per platform — by createCreatorProfile().
 */

// Display order doubles as "which one is the primary handle".
export const SIGNUP_PLATFORMS: { field: string; platform: PlatformEnum; label: string }[] = [
  { field: "instagram_handle", platform: "instagram", label: "Instagram" },
  { field: "tiktok_handle", platform: "tiktok", label: "TikTok" },
  { field: "youtube_handle", platform: "youtube_shorts", label: "YouTube" },
];

export type SignupHandles = Partial<Record<PlatformEnum, string>>;

export type CreatorSignupInput = {
  firstName: string;
  lastName: string;
  handles: SignupHandles;
};

/** Validates the name + handle fields of the signup form. */
export function parseCreatorSignup(
  formData: FormData,
): { ok: true; value: CreatorSignupInput } | { ok: false; error: string } {
  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("last_name") ?? "").trim().slice(0, 60);
  if (!firstName) return { ok: false, error: "Enter your first name." };
  if (!lastName) return { ok: false, error: "Enter your surname." };

  const handles: SignupHandles = {};
  for (const { field, platform, label } of SIGNUP_PLATFORMS) {
    const raw = String(formData.get(field) ?? "").trim();
    if (!raw) continue;
    const result = normaliseHandle(raw, platform);
    if (!result.ok) return { ok: false, error: `${label}: ${result.error}` };
    handles[platform] = result.handle;
  }
  if (Object.keys(handles).length === 0) {
    return { ok: false, error: "Add at least one social handle." };
  }
  return { ok: true, value: { firstName, lastName, handles } };
}

/** What gets stored on the auth user while the account awaits its code. */
export function signupMetadata(input: CreatorSignupInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    display_name: `${input.firstName} ${input.lastName}`,
    signup_handles: input.handles,
  };
}

/**
 * Creates the creator's profile from the metadata saved at signup. Safe to call
 * more than once: does nothing if the user already has an `applicants` row.
 * Uses the service-role client — only call it after the email code has been
 * verified for this user.
 */
export async function createCreatorProfile(userId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("applicants")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;

  const { data } = await admin.auth.admin.getUserById(userId);
  const user = data.user;
  if (!user?.email) return;

  const meta = (user.user_metadata ?? {}) as {
    first_name?: string;
    last_name?: string;
    signup_handles?: SignupHandles;
  };
  const handles = meta.signup_handles ?? {};
  const ordered = SIGNUP_PLATFORMS.filter(({ platform }) => handles[platform]);
  if (!meta.first_name || ordered.length === 0) return; // not a creator signup

  const primary = ordered[0];
  const { data: applicant, error } = await admin
    .from("applicants")
    .insert({
      user_id: userId,
      name: `${meta.first_name} ${meta.last_name ?? ""}`.trim(),
      email: user.email.toLowerCase(),
      handle: handles[primary.platform]!,
      platform: primary.platform,
      email_verified: true,
    })
    .select("id")
    .single();
  if (error || !applicant) {
    console.error("createCreatorProfile: applicants insert failed:", error?.message);
    return;
  }

  const { error: handlesError } = await admin.from("applicant_handles").insert(
    ordered.map(({ platform }, i) => {
      const handle = handles[platform]!;
      return {
        applicant_id: applicant.id,
        platform,
        handle,
        profile_url: normaliseHandle(handle, platform).profileUrl ?? null,
        is_primary: i === 0,
      };
    }),
  );
  if (handlesError) {
    console.error("createCreatorProfile: handles insert failed:", handlesError.message);
  }
}
