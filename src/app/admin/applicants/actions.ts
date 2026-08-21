"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  sendApplicantApprovedEmail,
  sendApplicantRejectedEmail,
  sendAssignmentEmail,
} from "@/lib/email/notifications";

export interface AdminActionState {
  error?: string;
  success?: string;
}

const statusSchema = z.object({
  applicant_id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export async function setApplicantStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = statusSchema.safeParse({
    applicant_id: formData.get("applicant_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  const { data: applicant, error } = await supabase
    .from("applicants")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.applicant_id)
    .select("name, email")
    .single();

  if (error || !applicant) {
    return { error: "Couldn't update that applicant." };
  }

  // Notify, but never let a mail failure roll back the status change.
  if (parsed.data.status === "approved") {
    await sendApplicantApprovedEmail(applicant.email, applicant.name);
  } else if (parsed.data.status === "rejected") {
    await sendApplicantRejectedEmail(applicant.email, applicant.name);
  }

  revalidatePath("/admin/applicants");
  return { success: `Marked ${parsed.data.status}.` };
}

const assignSchema = z.object({
  applicant_id: z.string().uuid(),
  job_id: z.string().uuid("Pick a job."),
  applicant_payout_amount: z.coerce
    .number()
    .min(0, "Payout can't be negative."),
});

export async function assignApplicantAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = assignSchema.safeParse({
    applicant_id: formData.get("applicant_id"),
    job_id: formData.get("job_id"),
    applicant_payout_amount: formData.get("applicant_payout_amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createClient();

  const { data: applicant } = await supabase
    .from("applicants")
    .select("name, email, status")
    .eq("id", parsed.data.applicant_id)
    .single();

  if (!applicant) return { error: "Applicant not found." };
  if (applicant.status !== "approved") {
    return { error: "Approve this applicant before assigning them a job." };
  }

  const { error } = await supabase.from("assignments").insert({
    applicant_id: parsed.data.applicant_id,
    job_id: parsed.data.job_id,
    applicant_payout_amount: parsed.data.applicant_payout_amount,
    status: "active",
  });

  if (error) {
    return { error: "Couldn't create that assignment." };
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", parsed.data.job_id)
    .single();

  await sendAssignmentEmail(
    applicant.email,
    applicant.name,
    job?.title ?? "your campaign",
    parsed.data.applicant_payout_amount,
  );

  revalidatePath("/admin/applicants");
  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/recruiting");
  return { success: "Assigned — the creator has been emailed." };
}
