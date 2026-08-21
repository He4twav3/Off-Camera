"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationReceivedEmail } from "@/lib/email/notifications";

export interface ApplyState {
  error?: string;
  success?: string;
}

const applySchema = z.object({
  job_id: z.string().uuid(),
  cover_note: z.string().trim().max(1000).optional(),
});

export async function applyToJobAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse({
    job_id: formData.get("job_id"),
    cover_note: formData.get("cover_note") ?? "",
  });

  if (!parsed.success) {
    return { error: "Something was off with that application. Try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to apply." };

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!applicant) {
    return { error: "Set up your profile before applying." };
  }
  if (applicant.status !== "approved") {
    return {
      error:
        "Your profile is still being reviewed. Once you're approved you can apply to campaigns.",
    };
  }

  // Don't let people apply to something that's already gone.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, status")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job) return { error: "That campaign no longer exists." };
  if (job.status !== "open") {
    return { error: "This campaign isn't taking applications any more." };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: parsed.data.job_id,
    applicant_id: applicant.id,
    cover_note: parsed.data.cover_note || null,
  });

  if (error) {
    // 23505 = unique_violation on (job_id, applicant_id).
    if (error.code === "23505") {
      return { error: "You've already applied to this campaign." };
    }
    return { error: "We couldn't send that application. Please try again." };
  }

  await sendApplicationReceivedEmail(applicant.name, job.title);

  revalidatePath(`/dashboard/recruiting/jobs/${parsed.data.job_id}`);
  revalidatePath("/dashboard/recruiting");
  revalidatePath("/admin/applications");
  return { success: "Application sent." };
}

const withdrawSchema = z.object({ application_id: z.string().uuid() });

export async function withdrawApplicationAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = withdrawSchema.safeParse({
    application_id: formData.get("application_id"),
  });

  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  // RLS scopes this to the caller's own row, and the DB trigger allows only
  // pending -> withdrawn for non-admins.
  const { error } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", parsed.data.application_id);

  if (error) {
    return { error: "We couldn't withdraw that. Please try again." };
  }

  revalidatePath("/dashboard/recruiting");
  revalidatePath("/admin/applications");
  return { success: "Application withdrawn." };
}
