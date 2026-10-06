import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Money pages need an admin whose session passed two-step verification.
 * The database enforces the same rule (is_admin_mfa), so this is the friendly
 * half: send them to set up or enter their code instead of showing an error.
 */
export async function requireAdminMfa(next: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (data?.currentLevel !== "aal2") {
    redirect(`/admin/security?next=${encodeURIComponent(next)}`);
  }
}
