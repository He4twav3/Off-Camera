"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  checkName,
  checkCity,
  checkCountry,
  checkBrands,
  composeLocation,
} from "@/lib/validation";

export interface ProfileFormState {
  error?: string;
  success?: string;
}

const MIN_AGE = 18;

function isOldEnough(dob: string) {
  const birth = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE);
  return birth <= cutoff;
}

// The profile is deliberately short: who you are, what you do, brands you've worked
// with. Accounts are connected on their own page, so they aren't part of this form.
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
  date_of_birth: z
    .string()
    .min(1, "Enter your date of birth.")
    .refine(
      isOldEnough,
      `You need to be ${MIN_AGE} or older to take on campaigns.`,
    ),
  country: z.string().trim(),
  city: z.string().trim().max(60).optional(),
  skills: z.array(z.string()).default([]),
  brands_worked_with: z.string().trim().max(500).optional(),
});

/** Splits a comma-separated field into a clean array. */
function toList(raw: string | undefined, max = 20): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

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
    date_of_birth: formData.get("date_of_birth"),
    country: formData.get("country") ?? "",
    city: formData.get("city") ?? "",
    skills: formData.getAll("skills").map(String),
    brands_worked_with: formData.get("brands_worked_with") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  // Content checks run server-side so they can't be bypassed by posting the form
  // directly. The client shows the same messages as a courtesy.
  const d = parsed.data;
  const fullName = `${d.first_name} ${d.last_name}`;
  const brandsList = toList(d.brands_worked_with, 30);

  const failed = [
    checkName(fullName),
    checkCountry(d.country),
    checkCity(d.city ?? ""),
    checkBrands(brandsList),
  ].find((c) => !c.ok);
  if (failed && !failed.ok) return { error: failed.error };

  // Phone-first signups have no email on the auth record; fall back to a
  // placeholder an admin can correct, since the column is NOT NULL.
  const email = user.email ?? `${user.phone ?? user.id}@no-email.local`;

  const fields = {
    name: fullName,
    username: d.username,
    email,
    location: composeLocation(d.city ?? "", d.country),
    skills: d.skills,
    // Reuses the list the content check already validated, so the stored value
    // is exactly what was screened.
    brands_worked_with: brandsList,
    date_of_birth: d.date_of_birth,
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
    : await supabase
        .from("applicants")
        .insert({
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
