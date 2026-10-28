"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readTemplate } from "@/lib/wise-batch";
import { readLastBatch, saveConfirmation, saveWiseTemplate } from "@/lib/payout-details-store";
import { sendBrandMarkedPaidEmail } from "@/lib/email/notifications";
import { alertAdmin } from "@/lib/whatsapp-alerts";
import { formatCurrency } from "@/lib/utils";

export interface WiseState {
  error?: string;
  success?: string;
}

/** The signed-in, approved brand, or an error. */
async function currentBrand() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." } as const;
  // RLS: a brand can only read its own account row.
  const { data: brand } = await supabase.from("brand_accounts").select("id, status, company_name").eq("user_id", user.id).maybeSingle();
  if (!brand || brand.status !== "approved") return { error: "Your brand account isn't approved yet." } as const;
  return { brand } as const;
}

/** The brand's blank Wise template ("Send to bank accounts", downloaded as CSV). Payment files then use its exact columns. */
export async function uploadWiseTemplateAction(_prev: WiseState, formData: FormData): Promise<WiseState> {
  const me = await currentBrand();
  if ("error" in me) return { error: me.error };
  const file = formData.get("template");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the template file you downloaded from Wise." };
  if (file.size > 1_000_000) return { error: "That file is too big for a blank Wise template." };
  if (!/\.csv$/i.test(file.name)) return { error: "Download the template from Wise as CSV (not XLSX), then upload that." };
  const text = await file.text();
  const parsed = readTemplate(text);
  if (!parsed.ok) return { error: parsed.error };
  // Only the header row is kept: nothing from Wise's example rows ends up in a payment file.
  if (!(await saveWiseTemplate(me.brand.id, parsed.header.map((h) => (/[",]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h)).join(",") + "\r\n")))
    return { error: "Couldn't save the template. Please try again." };
  revalidatePath("/brand/payments");
  return {
    success: parsed.unknown.length
      ? `Saved. Payment files now use your Wise columns. These stay blank, so check them in Wise: ${parsed.unknown.join(", ")}.`
      : "Saved. Payment files now use your Wise columns.",
  };
}

const paidSchema = z.object({ reference: z.string().trim().max(200).optional() });

const CONFIRMATION_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

/**
 * "I've paid the Wise batch." Marks every payment in the last file the brand downloaded as paid (the ones
 * still open), keeps the Wise confirmation, and asks each creator to confirm once the money arrives.
 */
export async function markBatchPaidAction(_prev: WiseState, formData: FormData): Promise<WiseState> {
  const me = await currentBrand();
  if ("error" in me) return { error: me.error };
  const parsed = paidSchema.safeParse({ reference: formData.get("reference") ?? "" });
  if (!parsed.success) return { error: "Keep the reference under 200 characters." };

  const last = await readLastBatch(me.brand.id);
  if (!last || last.statementIds.length === 0) return { error: "Download the Wise payment file first, then pay it in Wise." };

  const file = formData.get("confirmation");
  let proof: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!CONFIRMATION_TYPES.includes(file.type)) return { error: "Upload the confirmation as a screenshot (PNG or JPG) or a PDF." };
    if (file.size > 10_000_000) return { error: "That file is over 10 MB." };
    proof = await saveConfirmation(me.brand.id, file);
    if (!proof) return { error: "Couldn't upload the confirmation. Please try again." };
  }

  const db = createAdminClient();
  const { data: rows } = await db
    .from("direct_payments")
    .select("id, amount, brand_paid_at, creator_confirmed_at, assignments!inner(applicants(name, email), jobs!inner(title, brand_account_id))")
    .in("id", last.statementIds)
    .eq("assignments.jobs.brand_account_id", me.brand.id);
  const open = (rows ?? []).filter((r) => r.assignments?.jobs?.brand_account_id === me.brand.id && !r.brand_paid_at && !r.creator_confirmed_at);
  if (open.length === 0) return { success: "Already marked as paid." };

  const reference = parsed.data.reference || (proof ? "Wise batch, confirmation uploaded" : "Wise batch");
  const { error } = await db
    .from("direct_payments")
    .update({ brand_paid_at: new Date().toISOString(), brand_method: "Wise", brand_reference: reference.slice(0, 200) })
    .in("id", open.map((r) => r.id))
    .is("brand_paid_at", null);
  if (error) return { error: "Couldn't save that. Please try again." };

  for (const r of open) {
    const creator = r.assignments?.applicants;
    if (!creator) continue;
    await sendBrandMarkedPaidEmail({
      to: creator.email,
      name: creator.name,
      jobTitle: r.assignments?.jobs?.title ?? "your campaign",
      amount: Number(r.amount),
      method: "Wise",
    });
  }
  const total = open.reduce((n, r) => n + Number(r.amount), 0);
  alertAdmin(`Wise batch paid: ${me.brand.company_name} paid ${formatCurrency(total)} to ${open.length} ${open.length === 1 ? "creator" : "creators"}${proof ? " (confirmation uploaded)" : ""}`);

  revalidatePath("/brand", "layout");
  revalidatePath("/admin/statements");
  return { success: `Marked ${open.length} ${open.length === 1 ? "payment" : "payments"} as paid. We've told the creators their money is on the way.` };
}
