"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface JobFormState {
  error?: string;
  success?: string;
}

const jobSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Give the job a title.").max(200),
  description: z.string().trim().max(5000).optional(),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts", "x"]),
  niche_id: z.string().uuid("Pick a niche."),
  payout_type: z.enum(["flat", "cpm", "retainer"]),
  payout_amount: z.coerce.number().min(0, "Payout can't be negative."),
  payout_notes: z.string().trim().max(500).optional(),
  account_requirement: z.enum(["new_ok", "established_required"]),
  status: z.enum(["open", "filled", "closed"]),
  notion_sop_url: z
    .string()
    .trim()
    .url("Enter a full URL, starting with https://")
    .optional()
    .or(z.literal("")),
});

export async function saveJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const parsed = jobSchema.safeParse({
    id: (formData.get("id") as string) || "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    platform: formData.get("platform"),
    niche_id: formData.get("niche_id"),
    payout_type: formData.get("payout_type"),
    payout_amount: formData.get("payout_amount"),
    payout_notes: formData.get("payout_notes") ?? "",
    account_requirement: formData.get("account_requirement"),
    status: formData.get("status"),
    notion_sop_url: formData.get("notion_sop_url") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the job fields." };
  }

  const supabase = await createClient();
  const { id, ...values } = parsed.data;

  const row = {
    ...values,
    description: values.description ?? "",
    payout_notes: values.payout_notes || null,
    notion_sop_url: values.notion_sop_url || null,
  };

  // RLS restricts writes to admins; this runs as the signed-in admin, not
  // service-role, so the policy is doing the real enforcement.
  const { error } = id
    ? await supabase.from("jobs").update(row).eq("id", id)
    : await supabase.from("jobs").insert(row);

  if (error) {
    return { error: "Couldn't save the job. Please try again." };
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/dashboard/recruiting/jobs");
  return { success: id ? "Job updated." : "Job created." };
}

export async function deleteJobAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", id);

  revalidatePath("/admin/jobs");
  revalidatePath("/dashboard/recruiting/jobs");
}
