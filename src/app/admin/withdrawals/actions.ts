"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decisionErrorMessage } from "@/lib/balance";
import { sendWithdrawalPaidEmail } from "@/lib/email/notifications";

export interface DecisionState {
  error?: string;
  success?: string;
}

const schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["paid", "rejected"]),
  ref: z.string().trim().max(200).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function decideWithdrawalAction(
  _prev: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const parsed = schema.safeParse({
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
    success: parsed.data.action === "paid" ? "Marked paid — creator emailed." : "Rejected — the money is back in their balance.",
  };
}
