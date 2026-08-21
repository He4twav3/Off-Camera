"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface NicheState {
  error?: string;
  success?: string;
}

const createSchema = z.object({
  label: z.string().trim().min(1, "Give the niche a name.").max(60),
});

/** Slug is derived from the label so you never have to think about it. */
function slugify(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createNicheAction(
  _prev: NicheState,
  formData: FormData,
): Promise<NicheState> {
  const parsed = createSchema.safeParse({ label: formData.get("label") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const slug = slugify(parsed.data.label);
  if (!slug) {
    return { error: "That name needs at least one letter or number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("niches")
    .insert({ slug, label: parsed.data.label });

  if (error) {
    if (error.code === "23505") {
      return { error: "There's already a niche with that name." };
    }
    return { error: "Couldn't add that niche." };
  }

  revalidatePath("/admin/niches");
  revalidatePath("/dashboard/recruiting/jobs");
  return { success: `Added "${parsed.data.label}".` };
}

const toggleSchema = z.object({ id: z.string().uuid() });

/**
 * Niches are archived rather than deleted — jobs and applicant profiles
 * reference them, so removing one outright would break existing records.
 * Archiving hides it from the pickers and keeps history intact.
 */
export async function toggleNicheAction(formData: FormData) {
  const parsed = toggleSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("niches")
    .select("is_active")
    .eq("id", parsed.data.id)
    .single();

  await supabase
    .from("niches")
    .update({ is_active: !current?.is_active })
    .eq("id", parsed.data.id);

  revalidatePath("/admin/niches");
  revalidatePath("/dashboard/recruiting/jobs");
}

const renameSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(60),
});

export async function renameNicheAction(
  _prev: NicheState,
  formData: FormData,
): Promise<NicheState> {
  const parsed = renameSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
  });

  if (!parsed.success) return { error: "Enter a name." };

  const supabase = await createClient();
  // Only the label changes — the slug stays put so existing job-board filter
  // links keep working.
  const { error } = await supabase
    .from("niches")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.id);

  if (error) return { error: "Couldn't rename that niche." };

  revalidatePath("/admin/niches");
  revalidatePath("/dashboard/recruiting/jobs");
  return { success: "Renamed." };
}
