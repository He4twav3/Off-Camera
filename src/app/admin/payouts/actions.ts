"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendPayoutPaidEmail } from "@/lib/email/notifications";

export interface PayoutActionState {
  error?: string;
  success?: string;
}

const schema = z.object({
  assignment_id: z.string().uuid(),
  // Admin-only: what the client actually paid us. Recorded for our own books;
  // never rendered in, or joined into, any applicant-facing query.
  gross_amount: z.coerce.number().min(0, "Gross can't be negative."),
  notes: z.string().trim().max(1000).optional(),
  brand_paid: z.string().optional(),
  brand_payment_ref: z.string().trim().max(200).optional(),
  mark_paid: z.string().optional(),
});

export async function savePayoutAction(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const parsed = schema.safeParse({
    assignment_id: formData.get("assignment_id"),
    gross_amount: formData.get("gross_amount"),
    notes: formData.get("notes") ?? "",
    brand_paid: formData.get("brand_paid") ?? undefined,
    brand_payment_ref: formData.get("brand_payment_ref") ?? "",
    mark_paid: formData.get("mark_paid") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const supabase = await createClient();
  const markPaid = parsed.data.mark_paid === "on";
  const paidAt = markPaid ? new Date().toISOString() : null;

  // When the brand's money arrived: keep the date already on record, or set it
  // now if the box was just ticked. Unticking clears it.
  const { data: existingPayout } = await supabase
    .from("payouts")
    .select("brand_paid_at")
    .eq("assignment_id", parsed.data.assignment_id)
    .maybeSingle();
  const brandPaidAt =
    parsed.data.brand_paid === "on"
      ? (existingPayout?.brand_paid_at ?? new Date().toISOString())
      : null;

  // Funded before payable: a creator can't be marked paid until the brand's
  // payment has arrived (the database enforces this too).
  if (markPaid && !brandPaidAt) {
    return { error: "Tick “brand's payment has arrived” before marking the creator paid." };
  }
  if (markPaid && parsed.data.gross_amount <= 0) {
    return { error: "Enter the amount the brand paid before marking the creator paid." };
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id, applicant_payout_amount, applicants(name, email), jobs(title)",
    )
    .eq("id", parsed.data.assignment_id)
    .single();

  if (!assignment) return { error: "Assignment not found." };

  // One payout row per assignment (enforced by the unique constraint), so an
  // upsert keeps repeat saves idempotent. paid_at is set only after the credit below succeeds.
  const { error: payoutError } = await supabase.from("payouts").upsert(
    {
      assignment_id: parsed.data.assignment_id,
      gross_amount: parsed.data.gross_amount,
      applicant_payout_amount: assignment.applicant_payout_amount,
      brand_paid_at: brandPaidAt,
      brand_payment_ref: parsed.data.brand_payment_ref || null,
      notes: parsed.data.notes || null,
    },
    { onConflict: "assignment_id" },
  );

  if (payoutError) {
    return { error: "Couldn't save the payout record." };
  }

  if (markPaid) {
    // Manual release is the override for cases the automatic release doesn't cover.
    // If anything was already credited for this assignment (automatically, or by an
    // earlier release), don't add to it.
    const { data: earlier } = await supabase
      .from("balance_entries")
      .select("amount")
      .eq("assignment_id", parsed.data.assignment_id)
      .eq("kind", "earning");
    if ((earlier ?? []).length > 0) {
      return { error: "This assignment has already been credited to the creator's balance (automatically or earlier), so nothing more can be released here." };
    }

    const { data: owner } = await supabase
      .from("assignments")
      .select("applicant_id")
      .eq("id", parsed.data.assignment_id)
      .single();
    if (!owner) return { error: "Couldn't find the creator to credit." };

    // Credit first, then mark paid: if the credit is refused nothing is left half done.
    // The database refuses to credit more than the brand paid.
    const { error: creditError } = await supabase.from("balance_entries").insert({
      applicant_id: owner.applicant_id,
      amount: assignment.applicant_payout_amount,
      kind: "earning",
      stage: "full",
      assignment_id: parsed.data.assignment_id,
      note: assignment.jobs?.title ?? null,
    });
    if (creditError) {
      if (creditError.message.includes("exceeds_funded")) {
        return { error: "The creator's pay is more than the amount the brand paid. Check both amounts." };
      }
      if (creditError.code === "42501") {
        return { error: "Crediting balances needs two-step sign-in. Open Admin → Security, then try again." };
      }
      return { error: "Couldn't add it to the creator's balance. Nothing was marked paid; try again." };
    }

    const { error: assignmentError } = await supabase
      .from("assignments")
      .update({ status: "paid", paid_at: paidAt })
      .eq("id", parsed.data.assignment_id);
    const { error: closeError } = await supabase
      .from("payouts")
      .update({ paid_at: paidAt })
      .eq("assignment_id", parsed.data.assignment_id);
    if (assignmentError || closeError) {
      return { error: "The balance was credited, but marking it paid failed. Save again to finish." };
    }

    const applicant = assignment.applicants;
    if (applicant) {
      await sendPayoutPaidEmail(
        applicant.email,
        applicant.name,
        assignment.jobs?.title ?? "your campaign",
        assignment.applicant_payout_amount,
      );
    }
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/recruiting");
  return {
    success: markPaid ? "Added to the creator's balance — they've been emailed." : "Payout record saved.",
  };
}

const disputeSchema = z.object({
  assignment_id: z.string().uuid(),
  status: z.enum(["active", "submitted", "paid", "disputed"]),
});

export async function setAssignmentStatusAction(formData: FormData) {
  const parsed = disputeSchema.safeParse({
    assignment_id: formData.get("assignment_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("assignments")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.assignment_id);

  revalidatePath("/admin/payouts");
  revalidatePath("/dashboard/recruiting");
}

export interface ApproveState {
  error?: string;
  success?: string;
}

/** One click: the post is good. From here the release runs by itself (see lib/auto-release.ts). */
export async function approvePostAction(_prev: ApproveState, formData: FormData): Promise<ApproveState> {
  const id = z.string().uuid().safeParse(formData.get("assignment_id"));
  if (!id.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_assignment", { p_id: id.data });
  if (error) {
    if (error.message.includes("forbidden")) return { error: "Approving needs two-step sign-in. Open Admin → Security." };
    if (error.message.includes("already_approved")) return { error: "Already approved." };
    if (error.message.includes("not_submitted")) return { error: "The creator hasn't submitted a post for this one." };
    return { error: "Couldn't approve that. Try again." };
  }

  revalidatePath("/admin/payouts");
  return { success: "Approved." };
}
