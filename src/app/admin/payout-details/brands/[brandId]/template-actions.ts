"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminGuard } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { readTemplate } from "@/lib/wise-batch";
import { saveWiseTemplate } from "@/lib/payout-details-store";

export interface TemplateState {
  error?: string;
  success?: string;
}

/** The brand's blank Wise template, when the brand sends it to us instead of uploading it itself. */
export async function adminUploadWiseTemplateAction(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };
  const brandId = z.string().uuid().safeParse(formData.get("brand_id"));
  if (!brandId.success) return { error: "Something went wrong. Refresh and try again." };
  const file = formData.get("template");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the template file the brand sent." };
  if (file.size > 1_000_000) return { error: "That file is too big for a blank Wise template." };
  if (!/\.csv$/i.test(file.name)) return { error: "It has to be the CSV version. Ask the brand to download it from Wise as CSV, not XLSX." };
  const parsed = readTemplate(await file.text());
  if (!parsed.ok) return { error: parsed.error };
  const header = parsed.header.map((h) => (/[",]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h)).join(",") + "\r\n";
  if (!(await saveWiseTemplate(brandId.data, header))) return { error: "Couldn't save the template. Please try again." };
  await (await createClient()).rpc("log_admin_action", { p_action: "wise_template_uploaded", p_target: brandId.data });
  revalidatePath(`/admin/payout-details/brands/${brandId.data}`);
  return {
    success: parsed.unknown.length
      ? `Saved. These columns stay blank, so check them in Wise: ${parsed.unknown.join(", ")}.`
      : "Saved. Every column matches.",
  };
}
