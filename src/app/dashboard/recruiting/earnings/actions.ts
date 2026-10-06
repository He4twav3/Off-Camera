"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withdrawalErrorMessage, HOLD_HOURS } from "@/lib/balance";
import { encryptDetails, hashDetails, hashToken, newConfirmToken } from "@/lib/secret-box";
import { sendPayoutEmailChangedEmail, sendWithdrawalConfirmEmail, sendWithdrawalConfirmedEmail } from "@/lib/email/notifications";

export interface WithdrawState {
  error?: string;
  success?: string;
}

// The withdrawal functions are callable only by the server (0017), so every
// step goes through here: identify the creator from their session, then call
// the database as the service role with the creator's id.

const requestSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount."),
});

// Only used when the creator gives a new payout email.
const destinationSchema = z.object({
  holder: z.string().trim().min(2, "Add your name.").max(100),
  // Only an email address. Wise emails the creator a secure link to enter their
  // own bank details, so bank details never pass through our site.
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
});

/**
 * Withdraw. The creator either uses their saved payout email (one click) or gives
 * a new one, which is saved. The database decides how much confirmation is needed:
 * an email we've already paid is confirmed straight away (24h hold); a new or
 * changed email needs the emailed confirmation and a 72h hold, so a stolen session
 * can't redirect money to a destination we haven't paid before.
 */
export async function requestWithdrawalAction(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  const parsed = requestSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "You need to be logged in." };

  const admin = createAdminClient();
  const { data: applicant } = await admin
    .from("applicants")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant) return { error: withdrawalErrorMessage("no_profile") };

  const gaveNew = String(formData.get("email") ?? "").trim() !== "";
  let cipher: string;
  let hash: string;
  let hint: string;
  let holder: string;

  try {
    if (gaveNew) {
      const dest = destinationSchema.safeParse({ holder: formData.get("holder"), email: formData.get("email") });
      if (!dest.success) return { error: dest.error.issues[0]?.message ?? "Check the fields." };
      cipher = encryptDetails(`${dest.data.holder}\n${dest.data.email}`);
      hash = hashDetails(dest.data.email);
      hint = dest.data.email.slice(0, 4);
      holder = dest.data.holder;

      const { data: before } = await admin
        .from("payout_destinations")
        .select("hash")
        .eq("applicant_id", applicant.id)
        .maybeSingle();
      await admin
        .from("payout_destinations")
        .upsert({ applicant_id: applicant.id, cipher, hash, hint, holder, updated_at: new Date().toISOString() });
      // Someone else changing the destination is the main way money gets redirected: tell the owner.
      if (before && before.hash !== hash) {
        await sendPayoutEmailChangedEmail(user.email, applicant.name, hint);
      }
    } else {
      const { data: saved } = await admin
        .from("payout_destinations")
        .select("cipher, hash, hint, holder")
        .eq("applicant_id", applicant.id)
        .maybeSingle();
      if (!saved) return { error: "Add the email we should pay you through." };
      ({ cipher, hash, hint, holder } = saved);
    }
  } catch (e) {
    console.error("Withdrawal encryption unavailable:", (e as Error).message);
    return { error: "Withdrawals are temporarily unavailable. Please try again later." };
  }

  const { token, tokenHash } = newConfirmToken();
  const { data: id, error } = await admin.rpc("request_withdrawal", {
    p_user_id: user.id,
    p_amount: parsed.data.amount,
    p_cipher: cipher,
    p_last4: hint,
    p_hash: hash,
    p_holder: holder,
    p_token_hash: tokenHash,
  });
  if (error || !id) return { error: withdrawalErrorMessage(error?.message) };

  const { data: row } = await admin
    .from("withdrawals")
    .select("amount, hold_hours, status, payable_after, applicants(name)")
    .eq("id", id)
    .single();
  const name = row?.applicants?.name ?? "there";
  const amount = Number(row?.amount ?? parsed.data.amount);

  if (row?.status === "requested") {
    // An email we've already paid: confirmed on the spot.
    await sendWithdrawalConfirmedEmail({
      to: user.email,
      name,
      amount,
      last4: hint,
      earliest: new Date(row.payable_after ?? Date.now()),
    });
    revalidatePath("/dashboard/recruiting/earnings");
    revalidatePath("/admin/withdrawals");
    return { success: "Request sent. We'll pay it to your saved email after a short safety hold. You can cancel until then." };
  }

  const sent = await sendWithdrawalConfirmEmail({
    to: user.email,
    name,
    amount,
    last4: hint,
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

/** Forget the saved payout email. The next withdrawal asks for one again. */
export async function removeDestinationAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const admin = createAdminClient();
  const { data: applicant } = await admin.from("applicants").select("id").eq("user_id", user.id).maybeSingle();
  if (!applicant) return;
  await admin.from("payout_destinations").delete().eq("applicant_id", applicant.id);
  revalidatePath("/dashboard/recruiting/earnings");
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
