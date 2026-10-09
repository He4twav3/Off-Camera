"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface BrandAdminState {
  error?: string;
  success?: string;
}

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

/** Approve / reject a brand account. Runs as the signed-in admin, so the
 * brand_accounts admin-write policy is doing the real enforcement. */
export async function setBrandStatusAction(
  _prev: BrandAdminState,
  formData: FormData,
): Promise<BrandAdminState> {
  const parsed = schema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_accounts")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);
  if (error) return { error: "Couldn't update that brand." };

  revalidatePath("/admin/brands");
  revalidatePath("/admin");
  revalidatePath("/brand");
  return { success: parsed.data.status === "approved" ? "Approved." : "Updated." };
}
