"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkName } from "@/lib/validation";

export interface ProfileFormState {
  error?: string;
  success?: string;
}

// The profile is deliberately short: who you are and where you are. Accounts are
// connected on their own page, and the track record is worked out from real campaigns.
const schema = z.object({
  first_name: z.string().trim().min(1, "Tell us your first name.").max(60),
  last_name: z.string().trim().min(1, "Tell us your surname.").max(60),
  username: z
    .string()
    .trim()
    .transform((s) => s.toLowerCase())
    .refine(
      (s) => /^[a-z0-9_]{3,30}$/.test(s),
      "Usernames are 3–30 characters: lowercase letters, numbers and underscores.",
    ),
});

export async function saveProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/recruiting/profile-setup");

  const parsed = schema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  // Content checks run server-side so they can't be bypassed by posting the form
  // directly. The client shows the same messages as a courtesy.
  const d = parsed.data;
  const fullName = `${d.first_name} ${d.last_name}`;

  const nameCheck = checkName(fullName);
  if (!nameCheck.ok) return { error: nameCheck.error };

  // Phone-first signups have no email on the auth record; fall back to a
  // placeholder an admin can correct, since the column is NOT NULL.
  const email = user.email ?? `${user.phone ?? user.id}@no-email.local`;

  const fields = {
    name: fullName,
    username: d.username,
    email,
    marketing_opt_in: Boolean(user.user_metadata?.marketing_opt_in),
    tos_accepted_at:
      (user.user_metadata?.tos_accepted_at as string | undefined) ??
      new Date().toISOString(),
    email_verified: Boolean(user.email_confirmed_at),
  };

  const { data: current } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // An existing profile is updated in place, so anything filled in under the older,
  // longer form is left alone. A new one is inserted with an empty handle: the real
  // handle arrives when the first account is connected (a database trigger copies it
  // over from the main account).
  const { error } = current
    ? await supabase.from("applicants").update(fields).eq("id", current.id)
    : await supabase.from("applicants").insert({
        ...fields,
        user_id: user.id,
        handle: "",
        platform: "tiktok",
      });

  if (error) {
    // 23505 = unique_violation, which here means the username is taken.
    if (error.code === "23505") {
      return { error: "That username is already taken — try another." };
    }
    return { error: "We couldn't save your profile. Please try again." };
  }

  revalidatePath("/dashboard", "layout");

  // First save: the next step is connecting an account. After that, stay put.
  if (!current) redirect("/dashboard/account/accounts?welcome=1");
  return { success: "Saved." };
}
