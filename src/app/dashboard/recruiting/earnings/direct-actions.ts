"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { statementState } from "@/lib/direct-pay";
import { isCardNumber, parseBankDetails } from "@/lib/bank-details";
import { removeBankDetails, saveBankDetails } from "@/lib/payout-details-store";

export interface DirectState {
  error?: string;
  success?: string;
  /** What was typed, sent back with an error so the form keeps it (never a card number). */
  values?: Record<string, string>;
  /** Changes on every save attempt, so the form redraws with the values above. */
  attempt?: number;
}

/** The signed-in creator's applicant row, or null. Every action below starts here. */
async function currentApplicant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("applicants").select("id").eq("user_id", user.id).maybeSingle();
  return data ? { supabase, applicantId: data.id } : null;
}

/**
 * The creator's bank details, for the brand's Wise batch. Stored encrypted; only a summary
 * ("Bank account in EUR · IBAN ending 1234") is kept on the profile and shown to brands.
 */
export async function saveBankDetailsAction(_prev: DirectState, formData: FormData): Promise<DirectState> {
  const me = await currentApplicant();
  if (!me) return { error: "You need to be logged in." };

  if (formData.get("remove") === "1") {
    if (!(await removeBankDetails(me.applicantId))) return { error: "Couldn't remove them. Please try again." };
    revalidatePath("/dashboard/account/payments");
    revalidatePath("/dashboard/recruiting/earnings");
    return { success: "Removed.", attempt: Date.now() };
  }

  const input: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") input[k] = v;
  const parsed = parseBankDetails(input);
  if (!parsed.ok) {
    const values = Object.fromEntries(Object.entries(input).filter(([k, v]) => !k.startsWith("$") && !isCardNumber(v)));
    return { error: parsed.error, values, attempt: Date.now() };
  }

  const {
    data: { user },
  } = await me.supabase.auth.getUser();
  if (!(await saveBankDetails(me.applicantId, { ...parsed.value, email: user?.email ?? "" })))
    return { error: "Couldn't save that. Please try again." };

  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/dashboard/account/payments");
  return { success: "Saved. Brands pay you straight into this account through Wise.", attempt: Date.now() };
}

const idSchema = z.object({ id: z.string().uuid() });

/** The statement, only if it belongs to this creator. Null otherwise. */
async function ownStatement(applicantId: string, id: string) {
  const { data } = await createAdminClient()
    .from("direct_payments")
    .select("id, due_at, brand_paid_at, creator_confirmed_at, creator_disputed_at, assignments!inner(applicant_id)")
    .eq("id", id)
    .eq("assignments.applicant_id", applicantId)
    .maybeSingle();
  return data && data.assignments?.applicant_id === applicantId ? data : null;
}

/** "I received it." The creator's word is the proof that closes a statement. */
export async function confirmReceivedAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  const me = await currentApplicant();
  if (!parsed.success || !me) return;
  const statement = await ownStatement(me.applicantId, parsed.data.id);
  if (!statement || statement.creator_confirmed_at) return;

  await createAdminClient()
    .from("direct_payments")
    .update({
      creator_confirmed_at: new Date().toISOString(),
      creator_disputed_at: null,
      creator_dispute_note: null,
    })
    .eq("id", statement.id);
  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/statements");
}

const reportSchema = z.object({ id: z.string().uuid(), note: z.string().trim().max(500).optional() });

/** "I haven't been paid." Only once the brand says it paid or the due date has passed. */
export async function reportNotPaidAction(_prev: DirectState, formData: FormData): Promise<DirectState> {
  const parsed = reportSchema.safeParse({ id: formData.get("id"), note: formData.get("note") ?? "" });
  const me = await currentApplicant();
  if (!parsed.success || !me) return { error: "Something went wrong. Please try again." };
  const statement = await ownStatement(me.applicantId, parsed.data.id);
  if (!statement) return { error: "We couldn't find that payment." };

  const state = statementState(statement);
  if (state === "confirmed") return { error: "You already confirmed this payment." };
  if (state === "awaiting_payment") {
    return { error: "The brand still has until the due date to pay. If it hasn't by then, you can report it." };
  }

  await createAdminClient()
    .from("direct_payments")
    .update({ creator_disputed_at: new Date().toISOString(), creator_dispute_note: parsed.data.note || null })
    .eq("id", statement.id);
  revalidatePath("/dashboard/recruiting/earnings");
  revalidatePath("/admin/statements");
  return { success: "Thanks. We'll follow up with the brand." };
}
