"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { parseCodesCsv, programByKey } from "@/lib/affiliate-programs";
import { importCodes, retireCode } from "@/lib/affiliate-codes";

export type CodesState = { error?: string; success?: string };

/** The brand's list of partner codes, as it sent it. Adds new codes; codes already given out stay as they are. */
export async function uploadCodesAction(_prev: CodesState, formData: FormData): Promise<CodesState> {
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };
  const program = programByKey(String(formData.get("program") ?? ""));
  if (!program) return { error: "Something went wrong. Refresh and try again." };
  const file = formData.get("codes");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the code list the brand sent." };
  if (file.size > 1_000_000) return { error: "That file is too big for a code list." };
  if (!/\.csv$/i.test(file.name)) return { error: "It has to be the CSV file." };
  const parsed = parseCodesCsv(await file.text());
  if (!parsed.ok) return { error: parsed.error };
  const result = await importCodes(program.key, parsed.codes);
  if (!result.ok) return { error: `Couldn't save the codes (${result.error ?? "unknown error"}). Please try again.` };
  await (await createClient()).rpc("log_admin_action", { p_action: "affiliate_codes_uploaded", p_target: program.key });
  revalidatePath("/admin/affiliates");
  return {
    success: result.added
      ? `Added ${result.added} ${result.added === 1 ? "code" : "codes"}. ${result.total} in total.`
      : `Nothing new: all ${result.total} codes in that file are already here.`,
  };
}

/** Takes a code out of use. Its creator is given the next free code the next time they open Affiliates. */
export async function retireCodeAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const program = programByKey(String(formData.get("program") ?? ""));
  const code = String(formData.get("code") ?? "");
  if (!program || !code) return;
  if (await retireCode(program.key, code)) {
    await (await createClient()).rpc("log_admin_action", { p_action: "affiliate_code_retired", p_target: `${program.key}:${code}` });
  }
  revalidatePath("/admin/affiliates");
}
