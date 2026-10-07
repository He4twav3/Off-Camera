"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_METHODS } from "@/lib/direct-pay";
import { sendBrandMarkedPaidEmail } from "@/lib/email/notifications";

export interface BrandPayState {
  error?: string;
  success?: string;
}

const schema = z.object({
  id: z.string().uuid(),
  method: z.enum(BRAND_METHODS, { message: "Pick how you paid." }),
  reference: z.string().trim().max(200).optional(),
});

/**
 * The brand says it has paid a creator. The statement must belong to one of the
 * signed-in brand's own campaigns; the service role is used only after that
 * ownership is proved, because direct_payments is admin-only under RLS.
 */
export async function markBrandPaidAction(_prev: BrandPayState, formData: FormData): Promise<BrandPayState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    method: formData.get("method"),
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the fields." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved") return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("direct_payments")
    .select(
      "id, amount, brand_paid_at, creator_confirmed_at, assignments!inner(applicants(name, email), jobs!inner(title, brand_account_id))",
    )
    .eq("id", parsed.data.id)
    .eq("assignments.jobs.brand_account_id", brand.id)
    .maybeSingle();
  if (!row || row.assignments?.jobs?.brand_account_id !== brand.id) return { error: "We couldn't find that payment." };
  if (row.brand_paid_at || row.creator_confirmed_at) return { success: "Already marked as paid." };

  const { error } = await db
    .from("direct_payments")
    .update({
      brand_paid_at: new Date().toISOString(),
      brand_method: parsed.data.method,
      brand_reference: parsed.data.reference || null,
    })
    .eq("id", row.id)
    .is("brand_paid_at", null);
  if (error) return { error: "Couldn't save that. Please try again." };

  const creator = row.assignments?.applicants;
  if (creator) {
    await sendBrandMarkedPaidEmail({
      to: creator.email,
      name: creator.name,
      jobTitle: row.assignments?.jobs?.title ?? "your campaign",
      amount: Number(row.amount),
      method: parsed.data.method,
    });
  }

  revalidatePath("/brand");
  return { success: "Marked as paid. We've asked the creator to confirm." };
}
