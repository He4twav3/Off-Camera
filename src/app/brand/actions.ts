"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_METHODS } from "@/lib/direct-pay";
import { sendBrandMarkedPaidEmail } from "@/lib/email/notifications";
import {
  AVATAR_CONTENT_TYPES,
  avatarPathFromUrl,
  checkAvatarFile,
} from "@/lib/avatar";

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
export async function markBrandPaidAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    method: formData.get("method"),
    reference: formData.get("reference") ?? "",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the fields." };

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
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: row } = await db
    .from("direct_payments")
    .select(
      "id, amount, brand_paid_at, creator_confirmed_at, assignments!inner(applicants(name, email), jobs!inner(title, brand_account_id))",
    )
    .eq("id", parsed.data.id)
    .eq("assignments.jobs.brand_account_id", brand.id)
    .maybeSingle();
  if (!row || row.assignments?.jobs?.brand_account_id !== brand.id)
    return { error: "We couldn't find that payment." };
  if (row.brand_paid_at || row.creator_confirmed_at)
    return { success: "Already marked as paid." };

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

export interface BrandLogoState {
  error?: string;
  success?: string;
}

/**
 * A brand sets or removes the logo on one of its own campaigns. The campaign must belong
 * to the signed-in, approved brand; only after that is proved is the service role used
 * (the logos folder is admin-only for direct writes), and it changes the logo and nothing
 * else. What the file really is comes from its bytes, not its name.
 */
export async function setCampaignLogoAction(
  _prev: BrandLogoState,
  formData: FormData,
): Promise<BrandLogoState> {
  const jobId = z.string().uuid().safeParse(formData.get("job_id"));
  if (!jobId.success)
    return { error: "Something went wrong. Please refresh and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: job } = await db
    .from("jobs")
    .select("id, logo_url")
    .eq("id", jobId.data)
    .eq("brand_account_id", brand.id)
    .maybeSingle();
  if (!job) return { error: "That campaign isn't yours." };

  let logoUrl: string | null;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = checkAvatarFile(file.size, bytes, "logo");
    if (!checked.ok) return { error: checked.error };
    if (checked.type === "gif")
      return { error: "Use a JPG, PNG or WebP logo." };
    const path = `${crypto.randomUUID()}.${checked.type}`;
    const { error: uploadError } = await db.storage
      .from("campaign-logos")
      .upload(path, bytes, {
        contentType: AVATAR_CONTENT_TYPES[checked.type],
        upsert: false,
      });
    if (uploadError)
      return { error: "We couldn't upload that logo. Please try again." };
    logoUrl = db.storage.from("campaign-logos").getPublicUrl(path)
      .data.publicUrl;
  } else if (formData.get("remove") === "on") {
    logoUrl = null;
  } else {
    return { error: "Choose a logo to upload." };
  }

  const { error } = await db
    .from("jobs")
    .update({ logo_url: logoUrl })
    .eq("id", job.id);
  if (error) return { error: "Couldn't save the logo. Please try again." };

  // The logo it replaced is no longer used. Failing to tidy it up is harmless.
  const old = avatarPathFromUrl(job.logo_url, "campaign-logos");
  if (old) await db.storage.from("campaign-logos").remove([old]);

  revalidatePath("/brand");
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/admin/jobs");
  return { success: logoUrl ? "Logo updated." : "Logo removed." };
}

const denySchema = z.object({
  post_id: z.string().uuid(),
  reason: z.string().trim().max(200).optional(),
});

/**
 * A brand turns down one post on its own campaign (it doesn't qualify, or breaks the brief).
 * The post is marked rejected, so it stops counting and the creator sees why. The ownership
 * of the campaign is proved first; the service role is used only after that.
 */
export async function denyPostAction(
  _prev: BrandPayState,
  formData: FormData,
): Promise<BrandPayState> {
  const parsed = denySchema.safeParse({
    post_id: formData.get("post_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { error: "Check the fields." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };
  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand || brand.status !== "approved")
    return { error: "Your brand account isn't approved yet." };

  const db = createAdminClient();
  const { data: post } = await db
    .from("assignment_posts")
    .select("id, state, assignments(id, jobs(brand_account_id))")
    .eq("id", parsed.data.post_id)
    .maybeSingle();
  if (!post || post.assignments?.jobs?.brand_account_id !== brand.id)
    return { error: "We couldn't find that post." };
  if (post.state === "rejected") return { success: "Already denied." };

  const reason = parsed.data.reason
    ? `Denied by the brand: ${parsed.data.reason}`
    : "Denied by the brand.";
  const { error } = await db
    .from("assignment_posts")
    .update({ state: "rejected", reject_reason: reason })
    .eq("id", post.id);
  if (error) return { error: "We couldn't save that. Please try again." };

  revalidatePath("/brand", "layout");
  revalidatePath("/dashboard/recruiting", "layout");
  revalidatePath("/admin/statements");
  return { success: "Post denied." };
}
