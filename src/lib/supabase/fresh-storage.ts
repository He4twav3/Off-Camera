import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Service-role Storage with nothing cached, for private files that change and must be read as they are now (a
 * creator's bank details, the affiliate codes given out). Every read asks the server itself; write with
 * `cacheControl: "0"` so no copy is kept on the way either.
 */
export function freshStorage() {
  createAdminClient(); // checks the environment points at the right project
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => {
        const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
        if ((init?.method ?? "GET") === "GET" && url.pathname.includes("/storage/v1/object/")) url.searchParams.set("fresh", String(Date.now()));
        return fetch(typeof input === "string" || input instanceof URL ? url : new Request(url, input), { ...init, cache: "no-store" });
      },
    },
  }).storage;
}
