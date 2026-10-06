"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withdrawalErrorMessage } from "@/lib/balance";

export interface WithdrawState {
  error?: string;
  success?: string;
}

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount."),
  details: z.string().trim().min(5, "Add how we should pay you.").max(300),
});

export async function requestWithdrawalAction(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  const parsed = schema.safeParse({
    amount: formData.get("amount"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // The database checks the balance under a per-creator lock and takes the
  // money out of the balance in the same step, so this can't overdraw.
  const { error } = await supabase.rpc("request_withdrawal", {
    p_amount: parsed.data.amount,
    p_details: parsed.data.details,
  });
  if (error) return { error: withdrawalErrorMessage(error.message) };

  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/withdrawals");
  return { success: "Request sent. We'll pay it by bank transfer and email you when it's done." };
}
