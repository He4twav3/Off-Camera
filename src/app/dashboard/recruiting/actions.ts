"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface ProofFormState {
  error?: string;
  success?: string;
}

const schema = z.object({
  assignment_id: z.string().uuid(),
  proof_url: z
    .string()
    .trim()
    .url("Paste the full link to your post, starting with https://"),
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in." };

  // RLS restricts this to the caller's own assignment, and the DB trigger
  // permits only the active -> submitted transition plus proof_url — so the
  // payout amount and paid_at can't be touched from here even if the request
  // were tampered with.
  const { error } = await supabase
    .from("assignments")
    .update({ proof_url: parsed.data.proof_url, status: "submitted" })
    .eq("id", parsed.data.assignment_id);

  if (error) {
    return { error: "We couldn't save that link. Please try again." };
  }

  revalidatePath("/dashboard/recruiting");
  return { success: "Thanks — we'll review your post and release payment." };
}
