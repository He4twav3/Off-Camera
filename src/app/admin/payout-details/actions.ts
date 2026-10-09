"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { EMAILED_BRAND, EMAILED_CREATOR } from "@/lib/admin-payments";

export interface MarkState {
  error?: string;
  success?: string;
}

const schema = z.object({
  kind: z.enum(["brand", "creator"]),
  ids: z.string().regex(/^[0-9a-f-]{36}(,[0-9a-f-]{36})*$/i),
});

/**
 * "I sent this email." Recorded in the admin audit log with who and when, for each payment the email covered,
 * so the other admin sees it is done and doesn't send it twice. Runs as the signed-in admin.
 */
export async function markEmailedAction(_prev: MarkState, formData: FormData): Promise<MarkState> {
  const parsed = schema.safeParse({ kind: formData.get("kind"), ids: formData.get("ids") });
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();
  const action = parsed.data.kind === "brand" ? EMAILED_BRAND : EMAILED_CREATOR;
  for (const id of parsed.data.ids.split(",")) {
    const { error } = await supabase.rpc("log_admin_action", { p_action: action, p_target: id, p_detail: null });
    if (error) return { error: "Couldn't record that. Confirm your authenticator code and try again." };
  }
  revalidatePath("/admin/payout-details", "layout");
  revalidatePath("/admin", "layout");
  return { success: "Marked as sent." };
}
