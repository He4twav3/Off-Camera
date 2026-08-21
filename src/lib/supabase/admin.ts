import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role client — bypasses RLS entirely. Server-only, and only for the
// handful of code paths that must run with no signed-in user in scope (the
// weekly digest cron job). Every admin-panel action a logged-in admin takes
// should instead go through the normal server client (src/lib/supabase/server.ts)
// so it's still subject to the `is_admin()` RLS policies — don't reach for
// this just because it's convenient.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
