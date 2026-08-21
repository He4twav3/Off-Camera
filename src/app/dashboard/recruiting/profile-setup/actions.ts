"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { normaliseHandle } from "@/lib/handles";
import {
  checkName,
  checkCity,
  checkCountry,
  checkText,
  checkRate,
  checkLanguages,
  checkBrands,
  composeLocation,
} from "@/lib/validation";
import type { PlatformEnum } from "@/lib/database.types";

export interface ProfileFormState {
  error?: string;
}

const MIN_AGE = 18;

function isOldEnough(dob: string) {
  const birth = new Date(dob);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE);
  return birth <= cutoff;
}

const PLATFORMS = ["tiktok", "instagram", "youtube_shorts", "x"] as const;

const schema = z
  .object({
    name: z.string().trim().min(1, "Tell us your name.").max(120),
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
      .refine(isOldEnough, `You need to be ${MIN_AGE} or older to take on campaigns.`),
    country: z.string().trim(),
    city: z.string().trim().max(60).optional(),
    languages: z.array(z.string()).default([]),
    niche_interest_id: z.uuid("Pick a niche.").or(z.literal("")),
    skills: z.array(z.string()).default([]),
    content_types: z.array(z.string()).default([]),
    education_level: z.string().trim().max(60).optional(),
    education: z.string().trim().max(200).optional(),
    years_creating: z.coerce.number().min(0).max(80).nullable(),
    experience_summary: z.string().trim().max(1500).optional(),
    brands_worked_with: z.string().trim().max(500).optional(),
    preferred_pay_min: z.coerce.number().min(0).nullable(),
    preferred_pay_max: z.coerce.number().min(0).nullable(),
    bio: z.string().trim().max(1000).optional(),
    portfolio_url: z
      .url("Enter a full URL, starting with https://")
      .optional()
      .or(z.literal("")),
    availability_notes: z.string().trim().max(500).optional(),
    weekly_digest_opt_in: z.string().optional(),
  })
  .refine(
    (v) =>
      v.preferred_pay_min === null ||
      v.preferred_pay_max === null ||
      v.preferred_pay_min <= v.preferred_pay_max,
    { message: "Your minimum can't be higher than your maximum." },
  );

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

  const minRaw = (formData.get("preferred_pay_min") as string)?.trim();
  const maxRaw = (formData.get("preferred_pay_max") as string)?.trim();
  const yearsRaw = (formData.get("years_creating") as string)?.trim();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    date_of_birth: formData.get("date_of_birth"),
    country: formData.get("country") ?? "",
    city: formData.get("city") ?? "",
    languages: formData.getAll("languages").map(String),
    niche_interest_id: formData.get("niche_interest_id") ?? "",
    skills: formData.getAll("skills").map(String),
    content_types: formData.getAll("content_types").map(String),
    education_level: formData.get("education_level") ?? "",
    education: formData.get("education") ?? "",
    years_creating: yearsRaw ? yearsRaw : null,
    experience_summary: formData.get("experience_summary") ?? "",
    brands_worked_with: formData.get("brands_worked_with") ?? "",
    preferred_pay_min: minRaw ? minRaw : null,
    preferred_pay_max: maxRaw ? maxRaw : null,
    bio: formData.get("bio") ?? "",
    portfolio_url: formData.get("portfolio_url") ?? "",
    availability_notes: formData.get("availability_notes") ?? "",
    weekly_digest_opt_in: formData.get("weekly_digest_opt_in") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  // --- content checks: run server-side so they can't be bypassed by posting
  // the form directly. The client shows the same messages as a courtesy. ---
  const d0 = parsed.data;
  const brandsList = toList(d0.brands_worked_with, 30);

  const contentChecks = [
    checkName(d0.name),
    checkCountry(d0.country),
    checkCity(d0.city ?? ""),
    checkLanguages(d0.languages),
    checkBrands(brandsList),
    checkRate(d0.preferred_pay_min, d0.preferred_pay_max),
    checkText(d0.education, { label: "What you studied" }),
    // Long-form fields get the profanity screen but not the junk heuristics —
    // real prose trips those far too easily.
    checkText(d0.bio, { label: "Your bio", strict: false }),
    checkText(d0.experience_summary, {
      label: "Your experience",
      strict: false,
    }),
    checkText(d0.availability_notes, {
      label: "Your availability",
      strict: false,
    }),
  ];

  const failed = contentChecks.find((c) => !c.ok);
  if (failed) return { error: failed.error };

  // --- handles: re-validated server-side, never trusting the client ---
  const rawPlatforms = formData.getAll("handle_platform").map(String);
  const rawHandles = formData.getAll("handle_value").map(String);
  const rawFollowers = formData.getAll("handle_followers").map(String);

  const handles: {
    platform: PlatformEnum;
    handle: string;
    profile_url: string;
    follower_count: number | null;
    is_primary: boolean;
  }[] = [];

  for (let i = 0; i < rawHandles.length; i++) {
    const value = rawHandles[i]?.trim();
    if (!value) continue;

    const platform = rawPlatforms[i] as PlatformEnum;
    if (!PLATFORMS.includes(platform)) {
      return { error: "One of those platforms wasn't recognised." };
    }

    const result = normaliseHandle(value, platform);
    if (!result.ok) {
      return { error: result.error ?? "Check your handles." };
    }

    // Silently drop an exact duplicate rather than tripping the unique index.
    if (
      handles.some(
        (h) => h.platform === platform && h.handle === result.handle,
      )
    ) {
      continue;
    }

    const followers = Number.parseInt(rawFollowers[i] ?? "", 10);
    handles.push({
      platform,
      handle: result.handle,
      profile_url: result.profileUrl!,
      follower_count: Number.isFinite(followers) && followers >= 0 ? followers : null,
      is_primary: handles.length === 0,
    });
  }

  if (handles.length === 0) {
    return { error: "Add at least one account so we know where you post." };
  }

  const d = parsed.data;
  const primary = handles[0];

  // Phone-first signups have no email on the auth record; fall back to a
  // placeholder an admin can correct, since the column is NOT NULL.
  const email = user.email ?? `${user.phone ?? user.id}@no-email.local`;

  const row = {
    user_id: user.id,
    name: d.name,
    username: d.username,
    email,
    // Mirrors the primary handle; the DB trigger keeps these in sync too.
    handle: primary.handle,
    platform: primary.platform,
    niche_interest_id: d.niche_interest_id || null,
    location: composeLocation(d.city ?? "", d.country),
    languages: d.languages,
    availability_notes: d.availability_notes || null,
    skills: d.skills,
    content_types: d.content_types,
    education_level: d.education_level || null,
    education: d.education || null,
    years_creating: d.years_creating,
    experience_summary: d.experience_summary || null,
    // Reuses the list the content check already validated, so the stored value
    // is exactly what was screened.
    brands_worked_with: brandsList,
    preferred_pay_min: d.preferred_pay_min,
    preferred_pay_max: d.preferred_pay_max,
    bio: d.bio || null,
    portfolio_url: d.portfolio_url || null,
    date_of_birth: d.date_of_birth,
    weekly_digest_opt_in: d.weekly_digest_opt_in === "on",
    marketing_opt_in: Boolean(user.user_metadata?.marketing_opt_in),
    tos_accepted_at:
      (user.user_metadata?.tos_accepted_at as string | undefined) ??
      new Date().toISOString(),
    email_verified: Boolean(user.email_confirmed_at),
  };

  const { data: saved, error } = await supabase
    .from("applicants")
    .upsert(row, { onConflict: "user_id" })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation, which here means the username is taken.
    if (error.code === "23505") {
      return { error: "That username is already taken — try another." };
    }
    return { error: "We couldn't save your profile. Please try again." };
  }

  // Replace the handle set wholesale. Simpler than diffing, and safe because
  // verified_at is re-derived by you rather than being creator-owned data
  // worth preserving across an edit.
  await supabase.from("applicant_handles").delete().eq("applicant_id", saved.id);

  const { error: handlesError } = await supabase
    .from("applicant_handles")
    .insert(handles.map((h) => ({ ...h, applicant_id: saved.id })));

  if (handlesError) {
    return {
      error: "Your profile saved, but we couldn't save your accounts. Try again.",
    };
  }

  revalidatePath("/dashboard/recruiting");
  redirect("/dashboard/recruiting?welcome=1");
}
