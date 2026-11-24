"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { creditProgramByKey } from "@/lib/tool-credits";
import { markRequestsSent, unmarkRequestSent } from "@/lib/tool-credits-store";

/** Marks the creators shown on the page as sent to the brand. Only those ids, so anyone who signed up since stays waiting. */
export async function markSentAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const program = creditProgramByKey(String(formData.get("program") ?? ""));
  const ids = formData.getAll("id").map(String).filter(Boolean);
  if (!program || ids.length === 0) return;
  const marked = await markRequestsSent(program.key, ids);
  if (marked) await (await createClient()).rpc("log_admin_action", { p_action: "tool_credits_sent", p_target: `${program.key}:${marked}` });
  revalidatePath("/admin/credits");
}

/** Puts one creator back on the waiting list. */
export async function unmarkSentAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const program = creditProgramByKey(String(formData.get("program") ?? ""));
  const id = String(formData.get("id") ?? "");
  if (!program || !id) return;
  if (await unmarkRequestSent(program.key, id)) {
    await (await createClient()).rpc("log_admin_action", { p_action: "tool_credits_unsent", p_target: `${program.key}:${id}` });
  }
  revalidatePath("/admin/credits");
}
