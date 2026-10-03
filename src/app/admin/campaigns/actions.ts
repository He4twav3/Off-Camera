"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { refreshSignupViews } from "@/lib/campaign-views";

export interface CampaignAdminState {
  error?: string;
  success?: string;
}

const schema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["approve", "reject", "refresh"]),
});

/**
 * Approve / reject / re-count a campaign signup. The admin check is explicit
 * here because refreshSignupViews uses the service-role client, which would
 * otherwise bypass RLS for whoever called this action.
 */
export async function reviewSignupAction(
  _prev: CampaignAdminState,
  formData: FormData,
): Promise<CampaignAdminState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { error: "Not allowed." };

  const { id, intent } = parsed.data;

  if (intent === "reject") {
    const { error } = await supabase
      .from("campaign_signups")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return { error: "Couldn't update that signup." };
    revalidatePath("/admin/campaigns");
    return { success: "Rejected." };
  }

  if (intent === "approve") {
    const { error } = await supabase
      .from("campaign_signups")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: "Couldn't update that signup." };
  }

  // Approve counts immediately; Refresh re-counts an already-approved signup.
  const result = await refreshSignupViews(id);
  revalidatePath("/admin/campaigns");
  return result.ok
    ? { success: "Views counted." }
    : { error: `Approved, but counting had problems: ${result.error}` };
}
