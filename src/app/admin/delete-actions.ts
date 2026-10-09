"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminGuard } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DeleteState {
  error?: string;
  success?: string;
}

const idSchema = z.object({ id: z.string().uuid() });

/**
 * Delete a creator for good (their profile and their sign-in). Only when nothing is tied to them:
 * a creator who has joined a campaign has work and money on record, so they are rejected instead.
 */
export async function deleteCreatorAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { error: "Invalid request." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const db = createAdminClient();
  const { data: person } = await db.from("applicants").select("id, user_id").eq("id", id.data.id).maybeSingle();
  if (!person) return { success: "Already gone." };

  const { count } = await db.from("assignments").select("*", { count: "exact", head: true }).eq("applicant_id", person.id);
  if ((count ?? 0) > 0)
    return { error: "This creator has joined a campaign, so their work and payments stay on record. Reject them instead." };

  const { error } = await db.from("applicants").delete().eq("id", person.id);
  if (error) return { error: "This creator has activity that must stay on record, so they can't be deleted. Reject them instead." };
  if (person.user_id) await db.auth.admin.deleteUser(person.user_id);

  revalidatePath("/admin/applicants");
  revalidatePath("/admin");
  return { success: "Deleted." };
}

/** Delete a brand account for good. Only when it has no campaigns: detach or delete those first. */
export async function deleteBrandAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { error: "Invalid request." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const db = createAdminClient();
  const { data: brand } = await db.from("brand_accounts").select("id, user_id").eq("id", id.data.id).maybeSingle();
  if (!brand) return { success: "Already gone." };

  const { count } = await db.from("jobs").select("*", { count: "exact", head: true }).eq("brand_account_id", brand.id);
  if ((count ?? 0) > 0) return { error: "This brand still has campaigns attached. Detach or delete those first." };

  const { error } = await db.from("brand_accounts").delete().eq("id", brand.id);
  if (error) return { error: "This brand can't be deleted because it has records attached." };
  if (brand.user_id) await db.auth.admin.deleteUser(brand.user_id);

  revalidatePath("/admin/brands");
  revalidatePath("/admin");
  return { success: "Deleted." };
}

/** Delete one campaign signup from the list (an older, stand-alone list: it has no account or money attached). */
export async function deleteSignupAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { error: "Invalid request." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const { error } = await createAdminClient().from("campaign_signups").delete().eq("id", id.data.id);
  if (error) return { error: "This signup can't be deleted." };
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin");
  return { success: "Deleted." };
}

/** Delete one application from the list. */
export async function deleteApplicationAction(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return { error: "Invalid request." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const { error } = await createAdminClient().from("applications").delete().eq("id", id.data.id);
  if (error) return { error: "This application can't be deleted." };
  revalidatePath("/admin/applications");
  revalidatePath("/admin");
  return { success: "Deleted." };
}
