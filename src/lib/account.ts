import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

/**
 * Who is looking at their account, for the left panel of every account page.
 * Signed out goes to log in. Someone with no profile yet gets their display name.
 * RLS: a creator can only read their own profile row.
 */
export async function loadAccount(path: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${path}`);

  const [{ data: applicant }, session] = await Promise.all([
    supabase
      .from("applicants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    getSession(),
  ]);

  return {
    supabase,
    user,
    applicant,
    session,
    person: {
      name: applicant?.name ?? session?.displayName ?? "You",
      username: applicant?.username ?? null,
      avatarUrl: applicant?.avatar_url ?? null,
    },
  };
}
