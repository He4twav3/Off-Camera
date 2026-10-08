"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parsePostTerms, windowEnd } from "@/lib/post-terms";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BRAND_METHODS,
  STATEMENT_DUE_DAYS,
  dueDateFrom,
} from "@/lib/direct-pay";
import {
  sendBrandMarkedPaidEmail,
  sendStatementIssuedBrandEmail,
  sendStatementIssuedCreatorEmail,
} from "@/lib/email/notifications";

export interface StatementActionState {
  error?: string;
  success?: string;
}

// Every action here runs as the signed-in admin (not the service role), so the
// database's is_admin() policy on direct_payments applies. The service role is
// used only to look up a brand's login email, which the admin session can't read.

const issueSchema = z.object({
  assignment_id: z.string().uuid(),
  amount: z.coerce
    .number()
    .positive("Enter the amount the brand owes the creator.")
    .max(1_000_000),
  our_fee: z.coerce
    .number()
    .min(0, "Our fee can't be negative.")
    .max(1_000_000),
  due_days: z.coerce.number().int().min(1).max(90),
});

export async function issueStatementAction(
  _prev: StatementActionState,
  formData: FormData,
): Promise<StatementActionState> {
  const parsed = issueSchema.safeParse({
    assignment_id: formData.get("assignment_id"),
    amount: formData.get("amount"),
    our_fee: formData.get("our_fee") || 0,
    due_days: formData.get("due_days") || STATEMENT_DUE_DAYS,
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };

  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("assignments")
    .select(
      "id, status, applicants(name, email), jobs(title, brand_account_id, post_terms)",
    )
    .eq("id", parsed.data.assignment_id)
    .maybeSingle();
  if (!assignment) return { error: "Assignment not found." };
  if (assignment.status !== "submitted") {
    return {
      error:
        "A statement can only be issued once the creator has submitted their post.",
    };
  }

  // An older campaign gets one statement. A campaign paid per post (post_terms) gets one
  // per payment cycle, numbered 1, 2, 3...
  const { data: earlier } = await supabase
    .from("direct_payments")
    .select("cycle")
    .eq("assignment_id", assignment.id);
  const perPost = Boolean(assignment.jobs?.post_terms);
  if (!perPost && (earlier ?? []).length > 0) {
    return { error: "A statement was already issued for this creator." };
  }
  const cycle = Math.max(0, ...(earlier ?? []).map((e) => e.cycle)) + 1;

  const issued = new Date();
  const due = dueDateFrom(issued, parsed.data.due_days);
  const { error } = await supabase.from("direct_payments").insert({
    assignment_id: assignment.id,
    cycle,
    amount: parsed.data.amount,
    our_fee: parsed.data.our_fee,
    issued_at: issued.toISOString(),
    due_at: due.toISOString(),
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That statement was already issued."
          : "Couldn't save the statement.",
    };
  }

  const jobTitle = assignment.jobs?.title ?? "your campaign";
  if (assignment.applicants) {
    await sendStatementIssuedCreatorEmail({
      to: assignment.applicants.email,
      name: assignment.applicants.name,
      jobTitle,
      amount: parsed.data.amount,
      due,
    });
  }

  // Ask the brand to pay: needs an approved brand account attached to the campaign.
  let brandNote =
    " This campaign has no brand account attached, so nobody was emailed to pay. Record the payment yourself once you know.";
  const brandId = assignment.jobs?.brand_account_id;
  if (brandId) {
    const db = createAdminClient();
    const { data: brand } = await db
      .from("brand_accounts")
      .select("user_id, contact_name, status")
      .eq("id", brandId)
      .maybeSingle();
    if (brand && brand.status === "approved") {
      const { data: user } = await db.auth.admin.getUserById(brand.user_id);
      if (user.user?.email) {
        await sendStatementIssuedBrandEmail({
          to: user.user.email,
          contactName: brand.contact_name.split(" ")[0],
          jobTitle,
          creatorName: assignment.applicants?.name ?? "The creator",
          amount: parsed.data.amount,
          due,
        });
        brandNote = " The brand and the creator have both been emailed.";
      }
    }
  }

  revalidatePath("/admin/statements");
  return { success: `Statement issued.${brandNote}` };
}

const markPaidSchema = z.object({
  id: z.string().uuid(),
  method: z.enum(BRAND_METHODS),
  reference: z.string().trim().max(200).optional(),
});

/** Admin records a brand's payment on its behalf (the brand told us by email). */
export async function adminMarkBrandPaidAction(
  formData: FormData,
): Promise<void> {
  const parsed = markPaidSchema.safeParse({
    id: formData.get("id"),
    method: formData.get("method"),
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("direct_payments")
    .select(
      "id, amount, brand_paid_at, creator_confirmed_at, assignments(applicants(name, email), jobs(title))",
    )
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row || row.brand_paid_at || row.creator_confirmed_at) return;

  const { error } = await supabase
    .from("direct_payments")
    .update({
      brand_paid_at: new Date().toISOString(),
      brand_method: parsed.data.method,
      brand_reference: parsed.data.reference || null,
    })
    .eq("id", row.id);
  if (!error && row.assignments?.applicants) {
    await sendBrandMarkedPaidEmail({
      to: row.assignments.applicants.email,
      name: row.assignments.applicants.name,
      jobTitle: row.assignments.jobs?.title ?? "your campaign",
      amount: Number(row.amount),
      method: parsed.data.method,
    });
  }
  revalidatePath("/admin/statements");
}

const idSchema = z.object({ id: z.string().uuid() });

/** Our own fee: tick when the brand's payment of it has arrived. */
export async function toggleFeeReceivedAction(
  formData: FormData,
): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("direct_payments")
    .select("fee_received_at")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("direct_payments")
    .update({
      fee_received_at: row.fee_received_at ? null : new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  revalidatePath("/admin/statements");
  revalidatePath("/admin/fees");
  revalidatePath("/admin");
}

/** Remove a statement issued by mistake. Only before anyone has said it was paid. */
export async function voidStatementAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("direct_payments")
    .delete()
    .eq("id", parsed.data.id)
    .is("brand_paid_at", null)
    .is("creator_confirmed_at", null);
  revalidatePath("/admin/statements");
}

const postIdSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().max(250).optional(),
});

/** An admin rejects a post: it stops counting and the creator sees why. */
export async function rejectPostAction(formData: FormData): Promise<void> {
  const parsed = postIdSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("assignment_posts")
    .update({
      state: "rejected",
      reject_reason: parsed.data.reason || "An admin rejected this post.",
    })
    .eq("id", parsed.data.id);
  revalidatePath("/admin/statements");
}

/**
 * An admin accepts a post the automatic check couldn't confirm. It is treated as
 * verified, and its counting window runs from when it was submitted.
 */
export async function acceptPostAction(formData: FormData): Promise<void> {
  const parsed = postIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("assignment_posts")
    .select("id, submitted_at, posted_at, assignments(jobs(post_terms))")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!post) return;
  const terms = parsePostTerms(post.assignments?.jobs?.post_terms);
  if (!terms) return;

  const postedAt = new Date(post.posted_at ?? post.submitted_at);
  await supabase
    .from("assignment_posts")
    .update({
      state: "counting",
      author_verified: true,
      reject_reason: null,
      last_error: null,
      posted_at: postedAt.toISOString(),
      window_ends_at: windowEnd(postedAt, terms.windowDays).toISOString(),
    })
    .eq("id", post.id);
  revalidatePath("/admin/statements");
}
