"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Runs as the signed-in admin (not the service role), so the database's is_admin() policy on
// assignment_posts is what allows these writes.

const approveSchema = z.object({ post_id: z.string().uuid() });
const denySchema = z.object({ post_id: z.string().uuid(), reason: z.string().trim().max(200).optional() });

/** OnCamera approves a post: from now on it counts into what the brand owes. */
export async function approvePostAction(formData: FormData): Promise<void> {
  const parsed = approveSchema.safeParse({ post_id: formData.get("post_id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("assignment_posts")
    .update({ reviewed_at: new Date().toISOString() } as never)
    .eq("id", parsed.data.post_id)
    .neq("state", "rejected");
  revalidatePath("/admin/review");
  revalidatePath("/admin/statements");
  revalidatePath("/dashboard/recruiting", "layout");
}

/** OnCamera turns a post down. It stops counting and the creator sees why. */
export async function denyPostAsAdminAction(formData: FormData): Promise<void> {
  const parsed = denySchema.safeParse({ post_id: formData.get("post_id"), reason: formData.get("reason") ?? "" });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("assignment_posts")
    .update({
      state: "rejected",
      reject_reason: parsed.data.reason ? `Denied by OnCamera: ${parsed.data.reason}` : "Denied by OnCamera.",
    })
    .eq("id", parsed.data.post_id);
  revalidatePath("/admin/review");
  revalidatePath("/admin/statements");
  revalidatePath("/dashboard/recruiting", "layout");
}
