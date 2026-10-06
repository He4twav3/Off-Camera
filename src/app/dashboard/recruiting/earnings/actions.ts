"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withdrawalErrorMessage, HOLD_HOURS } from "@/lib/balance";
import { encryptDetails, hashDetails, hashToken, newConfirmToken } from "@/lib/secret-box";
import { sendWithdrawalConfirmEmail, sendWithdrawalConfirmedEmail } from "@/lib/email/notifications";

export interface WithdrawState {
  error?: string;
  success?: string;
}

// The withdrawal functions are callable only by the server (0017), so every
// step goes through here: identify the creator from their session, then call
// the database as the service role with the creator's id.

const requestSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount."),
  holder: z.string().trim().min(2, "Add your name.").max(100),
  // Only an email address. Wise emails the creator a secure link to enter their
  // own bank details, so bank details never pass through our site.
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
});

export async function requestWithdrawalAction(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  const parsed = requestSchema.safeParse({
    amount: formData.get("amount"),
    holder: formData.get("holder") ?? "",
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "You need to be logged in." };

  let box: string;
  let hash: string;
  try {
    box = encryptDetails(`${parsed.data.holder}\n${parsed.data.email}`);
    hash = hashDetails(parsed.data.email);
  } catch (e) {
    console.error("Withdrawal encryption unavailable:", (e as Error).message);
    return { error: "Withdrawals are temporarily unavailable. Please try again later." };
  }
  const { token, tokenHash } = newConfirmToken();
  // First 4 characters of the email, the only part kept once the request is closed.
  const tail = parsed.data.email.slice(0, 4);

  const admin = createAdminClient();
  const { data: id, error } = await admin.rpc("request_withdrawal", {
    p_user_id: user.id,
    p_amount: parsed.data.amount,
    p_cipher: box,
    p_last4: tail,
    p_hash: hash,
    p_holder: parsed.data.holder,
    p_token_hash: tokenHash,
  });
  if (error || !id) return { error: withdrawalErrorMessage(error?.message) };

  const { data: row } = await admin
    .from("withdrawals")
    .select("amount, hold_hours, applicants(name)")
    .eq("id", id)
    .single();

  const sent = await sendWithdrawalConfirmEmail({
    to: user.email,
    name: row?.applicants?.name ?? "there",
    amount: Number(row?.amount ?? parsed.data.amount),
    last4: tail,
    token,
    holdHours: row?.hold_hours ?? HOLD_HOURS.firstOrChanged,
  });
  if (sent.delivery !== "sent") {
    // No email, no way to confirm: give the money straight back.
    await admin.rpc("cancel_withdrawal", { p_user_id: user.id, p_id: id });
    revalidatePath("/dashboard/recruiting/earnings");
    return { error: "We couldn't send the confirmation email. Nothing was taken from your balance. Please try again." };
  }

  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/withdrawals");
  return { success: "Check your email and click the link to confirm. Until you do, the request isn't sent to us." };
}

export async function confirmWithdrawalAction(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  const token = String(formData.get("token") ?? "");
  if (token.length < 20 || token.length > 100) return { error: withdrawalErrorMessage("invalid_or_expired") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Sign in first, then open the link again." };

  const admin = createAdminClient();
  const { data: id, error } = await admin.rpc("confirm_withdrawal", {
    p_user_id: user.id,
    p_token_hash: hashToken(token),
  });
  if (error || !id) return { error: withdrawalErrorMessage(error?.message) };

  const { data: row } = await admin
    .from("withdrawals")
    .select("amount, details_last4, payable_after, applicants(name)")
    .eq("id", id)
    .single();
  if (row) {
    await sendWithdrawalConfirmedEmail({
      to: user.email,
      name: row.applicants?.name ?? "there",
      amount: Number(row.amount),
      last4: row.details_last4 ?? "",
      earliest: new Date(row.payable_after ?? Date.now()),
    });
  }

  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/withdrawals");
  return { success: "Confirmed. We'll pay it after the safety hold. You can cancel until then." };
}

export async function cancelWithdrawalAction(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await createAdminClient().rpc("cancel_withdrawal", { p_user_id: user.id, p_id: id.data });
  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/withdrawals");
}
