"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { creditProgramFor, normalizeEmail } from "@/lib/tool-credits";
import { saveRequest } from "@/lib/tool-credits-store";

export type CreditsState = { error?: string; success?: string; value?: string };

/** A creator on the campaign gives the email of their account on the brand's site, for the brand to add credits to. */
export async function saveCreditsEmailAction(_prev: CreditsState, formData: FormData): Promise<CreditsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again, then try once more." };
  const { data: applicant } = await supabase.from("applicants").select("id, name, email").eq("user_id", user.id).maybeSingle();
  if (!applicant) return { error: "Set up your profile first." };

  const jobId = String(formData.get("job") ?? "");
  const typed = String(formData.get("email") ?? "");
  // Only a creator on the campaign (RLS: their own assignments) can ask for its credits.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, jobs(id, title, about)")
    .eq("applicant_id", applicant.id)
    .eq("job_id", jobId)
    .maybeSingle();
  const program = assignment?.jobs ? creditProgramFor(assignment.jobs) : null;
  if (!program) return { error: "You can add this once you're on the campaign.", value: typed };

  const toolEmail = normalizeEmail(typed);
  if (!toolEmail) return { error: `Enter the email you signed up to ${program.brand} with.`, value: typed };
  const ok = await saveRequest(program, {
    applicantId: applicant.id,
    name: applicant.name,
    email: applicant.email,
    toolEmail,
    submittedAt: new Date().toISOString(),
  });
  if (!ok) return { error: "Couldn't save it. Please try again.", value: typed };
  revalidatePath(`/dashboard/recruiting/jobs/${jobId}`);
  return { success: "Saved. We'll send it to the brand for your credits.", value: toolEmail };
}
