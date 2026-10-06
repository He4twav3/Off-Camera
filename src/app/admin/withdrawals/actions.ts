"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decisionErrorMessage } from "@/lib/balance";
import { decryptDetails } from "@/lib/secret-box";
import { sendWithdrawalPaidEmail } from "@/lib/email/notifications";

export interface DecisionState {
  error?: string;
  success?: string;
}

// Every admin action runs as the signed-in admin (not the service role), so the
// database's is_admin() checks apply and the audit log records who did it.

const decideSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "paid", "rejected"]),
  ref: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function decideWithdrawalAction(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const parsed = decideSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    ref: formData.get("ref") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: "Check the fields." };
  if (parsed.data.action === "rejected" && !parsed.data.note) {
    return { error: "Add a short reason so the creator knows why." };
  }

  const supabase = await createClient();

  // Read who to email before the decision (admins can read both tables).
  const { data: w } = await supabase
    .from("withdrawals")
    .select("amount, applicants(name, email)")
    .eq("id", parsed.data.id)
    .maybeSingle();

  const { error } = await supabase.rpc("decide_withdrawal", {
    p_id: parsed.data.id,
    p_action: parsed.data.action,
    p_ref: parsed.data.ref || null,
    p_note: parsed.data.note || null,
  });
  if (error) return { error: decisionErrorMessage(error.message) };

  if (parsed.data.action === "paid" && w?.applicants) {
    await sendWithdrawalPaidEmail(w.applicants.email, w.applicants.name, Number(w.amount));
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard/recruiting/earnings");
  return {
    success:
      parsed.data.action === "paid"
        ? "Marked paid — creator emailed."
        : parsed.data.action === "approve"
          ? "Approved. A different admin now has to mark it paid."
          : "Rejected — the money is back in their balance.",
  };
}

/** Shows an admin the payment details of one open request. Logged every time. */
export async function revealDetailsAction(id: string): Promise<{ details?: string; error?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "Only admins can do that." };

  const { data: w } = await supabase
    .from("withdrawals")
    .select("payout_details, status")
    .eq("id", id)
    .maybeSingle();
  if (!w) return { error: "That request no longer exists." };
  if (!w.payout_details.startsWith("v1.")) return { details: w.payout_details };

  let details: string;
  try {
    details = decryptDetails(w.payout_details);
  } catch (e) {
    console.error("Couldn't decrypt withdrawal details:", (e as Error).message);
    return { error: "Couldn't decrypt these details. Is WITHDRAWAL_DETAILS_KEY set to the original key?" };
  }

  await supabase.rpc("log_admin_action", { p_action: "withdrawal_details_revealed", p_target: id });
  revalidatePath("/admin/withdrawals");
  return { details };
}

const freezeSchema = z.object({
  applicant_id: z.string().uuid(),
  frozen: z.enum(["true", "false"]),
  reason: z.string().trim().max(300).optional(),
});

export async function freezeWithdrawalsAction(formData: FormData): Promise<void> {
  const parsed = freezeSchema.safeParse({
    applicant_id: formData.get("applicant_id"),
    frozen: formData.get("frozen"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc("freeze_withdrawals", {
    p_applicant: parsed.data.applicant_id,
    p_frozen: parsed.data.frozen === "true",
    p_reason: parsed.data.reason || null,
  });
  revalidatePath("/admin/withdrawals");
}
