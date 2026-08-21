"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  sendApplicationAcceptedEmail,
  sendApplicationDeclinedEmail,
  sendAssignmentEmail,
} from "@/lib/email/notifications";

export interface ReviewState {
  error?: string;
  success?: string;
}

const acceptSchema = z.object({
  application_id: z.string().uuid(),
  applicant_payout_amount: z.coerce
    .number()
    .min(0, "Payout can't be negative."),
});

/**
 * Accepting an application does two things at once: marks it accepted and
 * creates the assignment with the payout you quote here. That keeps you from
 * having to re-find the same person on another screen to put them on the job.
 */
export async function acceptApplicationAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = acceptSchema.safeParse({
    application_id: formData.get("application_id"),
    applicant_payout_amount: formData.get("applicant_payout_amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the amount." };
  }

  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, job_id, applicant_id, applicants(name, email), jobs(title, status)")
    .eq("id", parsed.data.application_id)
    .single();

  if (!application) return { error: "Application not found." };
  if (application.status !== "pending") {
    return { error: "That application has already been dealt with." };
  }

  // Guard against double-assigning the same person to the same job — they may
  // already have been assigned manually from the applicants screen.
  const { data: existing } = await supabase
    .from("assignments")
    .select("id")
    .eq("applicant_id", application.applicant_id)
    .eq("job_id", application.job_id)
    .maybeSingle();

  if (existing) {
    return { error: "They're already assigned to this campaign." };
  }

  const { error: assignError } = await supabase.from("assignments").insert({
    job_id: application.job_id,
    applicant_id: application.applicant_id,
    applicant_payout_amount: parsed.data.applicant_payout_amount,
    status: "active",
  });

  if (assignError) {
    return { error: "Couldn't create the assignment. Nothing was changed." };
  }

  const { error: statusError } = await supabase
    .from("applications")
    .update({ status: "accepted", decided_at: new Date().toISOString() })
    .eq("id", parsed.data.application_id);

  if (statusError) {
    return {
      error:
        "Assignment created, but the application status didn't update. Check the payouts screen.",
    };
  }

  const person = application.applicants;
  const job = application.jobs;
  if (person && job) {
    await sendApplicationAcceptedEmail(person.email, person.name, job.title);
    await sendAssignmentEmail(
      person.email,
      person.name,
      job.title,
      parsed.data.applicant_payout_amount,
    );
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/recruiting");
  return { success: "Accepted and assigned — they've been emailed." };
}

const declineSchema = z.object({ application_id: z.string().uuid() });

export async function declineApplicationAction(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = declineSchema.safeParse({
    application_id: formData.get("application_id"),
  });

  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("applications")
    .update({ status: "declined", decided_at: new Date().toISOString() })
    .eq("id", parsed.data.application_id)
    .select("applicants(name, email), jobs(title)")
    .single();

  if (error || !application) {
    return { error: "Couldn't decline that application." };
  }

  const person = application.applicants;
  const job = application.jobs;
  if (person && job) {
    await sendApplicationDeclinedEmail(person.email, person.name, job.title);
  }

  revalidatePath("/admin/applications");
  return { success: "Declined — they've been emailed." };
}

const verifySchema = z.object({ handle_id: z.string().uuid() });

/** Records that you clicked through and confirmed the account is real. */
export async function toggleHandleVerifiedAction(formData: FormData) {
  const parsed = verifySchema.safeParse({
    handle_id: formData.get("handle_id"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("applicant_handles")
    .select("verified_at")
    .eq("id", parsed.data.handle_id)
    .single();

  await supabase
    .from("applicant_handles")
    .update({
      verified_at: current?.verified_at ? null : new Date().toISOString(),
    })
    .eq("id", parsed.data.handle_id);

  revalidatePath("/admin/applications");
  revalidatePath("/admin/applicants");
}
