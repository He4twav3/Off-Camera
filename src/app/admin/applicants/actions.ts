"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendApplicantApprovedEmail, sendApplicantRejectedEmail } from "@/lib/email/notifications";

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
