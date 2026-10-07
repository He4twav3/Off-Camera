"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePayoutInstructions, statementState } from "@/lib/direct-pay";

export interface DirectState {
  error?: string;
  success?: string;
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

/** How the creator wants brands to pay them. Shown only to a brand that owes them money. */
export async function savePayoutInstructionsAction(_prev: DirectState, formData: FormData): Promise<DirectState> {
  const me = await currentApplicant();
  if (!me) return { error: "You need to be logged in." };

  const raw = String(formData.get("payout_instructions") ?? "");
  let value: string | null = null;
  if (raw.trim() !== "") {
    const parsed = parsePayoutInstructions(raw);
    if (!parsed.ok) return { error: parsed.error };
    value = parsed.value;
  }

  const { error } = await me.supabase.from("applicants").update({ payout_instructions: value }).eq("id", me.applicantId);
  if (error) return { error: "Couldn't save that. Please try again." };

  revalidatePath("/dashboard/recruiting/earnings");
  return { success: value ? "Saved. Brands you work with will see this." : "Removed." };
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
