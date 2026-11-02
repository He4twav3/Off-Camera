"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeLink, programByKey } from "@/lib/affiliate-programs";
import { saveLink } from "@/lib/affiliate-codes";

export type LinkState = { error?: string; success?: string; value?: string };

/** The creator saves the personal link the brand gave them, so it sits next to their code for the brand's report. */
export async function saveAffiliateLinkAction(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again, then try once more." };
  const { data: applicant } = await supabase.from("applicants").select("id").eq("user_id", user.id).maybeSingle();
  if (!applicant) return { error: "Set up your profile first." };

  const program = programByKey(String(formData.get("program") ?? ""));
  if (!program) return { error: "Something went wrong. Refresh and try again." };
  const typed = String(formData.get("link") ?? "");
  const link = normalizeLink(program, typed);
  if (!link) return { error: `Paste the link ${program.brand} gave you. It looks like ${program.linkExample}.`, value: typed };
  if (!(await saveLink(program.key, applicant.id, link))) return { error: "Couldn't save it. Please try again.", value: typed };
  revalidatePath("/dashboard/recruiting/affiliates");
  return { success: "Saved.", value: link };
}
