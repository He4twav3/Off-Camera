"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchBio, verificationCode } from "@/lib/handle-verification";
import { refreshAssignmentViews } from "@/lib/campaign-views";
import { checkPostLink } from "@/lib/post-link";

export interface ProofFormState {
  error?: string;
  success?: string;
}

const schema = z.object({
  assignment_id: z.string().uuid(),
  // Checked against the campaign's platform below.
  proof_url: z.string().trim().min(1, "Paste the link to your post.").max(500),
});

export async function submitProofAction(
  _prev: ProofFormState,
  formData: FormData,
): Promise<ProofFormState> {
  const parsed = schema.safeParse({
    assignment_id: formData.get("assignment_id"),
    proof_url: formData.get("proof_url"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the link." };
  }
  if (formData.get("disclosed") !== "on") {
    return { error: "Confirm the post is labelled as a paid partnership before submitting." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in." };

  // The link has to be a post on the platform this campaign is for. RLS makes
  // this return only the caller's own assignment.
  const { data: target } = await supabase
    .from("assignments")
    .select("id, jobs(platform)")
    .eq("id", parsed.data.assignment_id)
    .maybeSingle();
  if (!target?.jobs) return { error: "We couldn't find that campaign." };
  const link = checkPostLink(parsed.data.proof_url, target.jobs.platform);
  if (!link.ok) return { error: link.error };

  // RLS restricts this to the caller's own assignment, and the DB trigger
  // permits only the active -> submitted transition plus proof_url — so the
  // payout amount and paid_at can't be touched from here even if the request
  // were tampered with.
  const { error } = await supabase
    .from("assignments")
    .update({ proof_url: link.url, status: "submitted" })
    .eq("id", parsed.data.assignment_id);

  if (error) {
    return { error: "We couldn't save that link. Please try again." };
  }

  // Count the post's views once the response is on its way — it calls
  // YouTube/Apify and can take a while, and a failure must never affect the
  // creator's submission. The daily cron retries.
  const assignmentId = parsed.data.assignment_id;
  after(async () => {
    try {
      await refreshAssignmentViews(assignmentId);
    } catch (err) {
      console.error("refreshAssignmentViews failed:", err);
    }
  });

  revalidatePath("/dashboard/recruiting");
  return { success: "Thanks — we'll review your post and release payment." };
}

export interface VerifyHandleState {
  error?: string;
  success?: string;
}

/**
 * Checks a creator's bio for their verification code and, if it's there, marks
 * the handle verified. The write uses the service-role client because
 * `verified_at` is protected by a database trigger (migration 0010) — a creator
 * can read their own handle (RLS) but can never set this column themselves.
 */
export async function verifyHandleAction(
  _prev: VerifyHandleState,
  formData: FormData,
): Promise<VerifyHandleState> {
  const id = z.string().uuid().safeParse(formData.get("handle_id"));
  if (!id.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS: only returns the row if it belongs to the caller's own applicant.
  const { data: handle } = await supabase
    .from("applicant_handles")
    .select("id, applicant_id, platform, handle, verified_at")
    .eq("id", id.data)
    .maybeSingle();
  if (!handle) return { error: "Account not found." };
  if (handle.verified_at) return { success: "Already verified." };

  const code = verificationCode(handle.applicant_id, handle.platform, handle.handle);
  const bio = await fetchBio(handle.platform, handle.handle);
  if (!bio.ok) return { error: bio.message };

  if (!bio.bio.toLowerCase().includes(code.toLowerCase())) {
    return {
      error: `We couldn't see ${code} in the bio yet. Add it, save, wait a minute, then check again.`,
    };
  }

  const { error } = await createAdminClient()
    .from("applicant_handles")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", handle.id);
  if (error) return { error: "Couldn't save the verification. Try again." };

  revalidatePath("/dashboard/recruiting");
  return { success: "Verified." };
}
