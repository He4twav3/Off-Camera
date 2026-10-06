"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationReceivedEmail } from "@/lib/email/notifications";
import { parseDriveLink } from "@/lib/drive-link";

export interface ApplyState {
  error?: string;
  success?: string;
}

const applySchema = z.object({
  job_id: z.string().uuid(),
  cover_note: z.string().trim().max(1000).optional(),
  sample_url: z.string().trim().max(500).optional(),
});

export async function applyToJobAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse({
    job_id: formData.get("job_id"),
    cover_note: formData.get("cover_note") ?? "",
    sample_url: formData.get("sample_url") ?? "",
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
    .select("id, title, status, sample_required")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job) return { error: "That campaign no longer exists." };
  if (job.status !== "open") {
    return { error: "This campaign isn't taking applications any more." };
  }

  // The sample video is only asked for when the campaign turns it on. If the
  // creator pastes one anyway it still has to be a real Google Drive link.
  let sampleUrl: string | null = null;
  if (job.sample_required || parsed.data.sample_url) {
    const link = parseDriveLink(parsed.data.sample_url ?? "");
    if (!link.ok) return { error: link.error };
    sampleUrl = link.url;
  }

  const { error } = await supabase.from("applications").insert({
    job_id: parsed.data.job_id,
    applicant_id: applicant.id,
    cover_note: parsed.data.cover_note || null,
    sample_url: sampleUrl,
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
