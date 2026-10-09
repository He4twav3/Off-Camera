"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminGuard } from "@/lib/admin-guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAccountCascade, deleteJobCascade, loadCleanup } from "@/lib/admin-cleanup";

export interface CleanupState {
  error?: string;
  done?: { deleted: number; failed: string[] };
}

const schema = z.object({
  confirm: z.literal("DELETE"),
  users: z.array(z.string().uuid()).max(500),
  jobs: z.array(z.string().uuid()).max(500),
});

/**
 * Delete the picked accounts and campaigns for good. The protected set is worked out again here from the
 * database, so a tampered form can't reach an admin, Getimg, or anyone on Getimg's campaign. Runs only for
 * a signed-in admin who has passed two-step sign-in. Each deletion is written to the admin log.
 */
export async function cleanupAction(_prev: CleanupState, formData: FormData): Promise<CleanupState> {
  const parsed = schema.safeParse({
    confirm: formData.get("confirm"),
    users: formData.getAll("user"),
    jobs: formData.getAll("job"),
  });
  if (!parsed.success) return { error: "Type DELETE in capitals to confirm." };
  const blocked = await adminGuard();
  if (blocked) return { error: blocked };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const plan = await loadCleanup(user.id);
  const okUsers = new Set(plan.accounts.filter((a) => !a.keptBecause || a.soft).map((a) => a.userId));
  const okJobs = new Set(plan.campaigns.filter((c) => !c.keptBecause).map((c) => c.id));
  const emailOf = new Map(plan.accounts.map((a) => [a.userId, a.email]));
  const titleOf = new Map(plan.campaigns.map((c) => [c.id, c.title]));

  const db = createAdminClient();
  const failed: string[] = [];
  let deleted = 0;
  for (const id of parsed.data.jobs) {
    if (!okJobs.has(id)) continue;
    const err = await deleteJobCascade(db, id);
    if (err) failed.push(`Campaign “${titleOf.get(id)}”: ${err}`);
    else {
      deleted++;
      await supabase.rpc("log_admin_action", { p_action: "cleanup_deleted_campaign", p_target: id, p_detail: titleOf.get(id) ?? null });
    }
  }
  for (const id of parsed.data.users) {
    if (!okUsers.has(id)) continue;
    const err = await deleteAccountCascade(db, id);
    if (err) failed.push(`${emailOf.get(id)}: ${err}`);
    else {
      deleted++;
      await supabase.rpc("log_admin_action", { p_action: "cleanup_deleted_account", p_target: id, p_detail: emailOf.get(id) ?? null });
    }
  }
  for (const p of ["/admin", "/admin/brands", "/admin/applicants", "/admin/cleanup"]) revalidatePath(p);
  return { done: { deleted, failed } };
}
