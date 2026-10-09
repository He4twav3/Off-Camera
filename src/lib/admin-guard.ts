import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * For admin actions that need the service role (deleting accounts): prove the caller is an admin
 * who has passed two-step sign-in, by the same database functions the policies use. Returns an
 * error message when not.
 */
export async function adminGuard(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "You need to be signed in.";
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return "Not allowed.";
  if (process.env.ADMIN_REQUIRE_MFA !== "off") {
    // is_admin_mfa is a database function not listed in the generated types.
    const { data: mfa } = await (
      supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
    ).rpc("is_admin_mfa");
    if (!mfa) return "Confirm your authenticator code first.";
  }
  return null;
}
