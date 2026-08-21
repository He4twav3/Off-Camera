import { createClient } from "@/lib/supabase/server";

export interface ShellData {
  signedIn: boolean;
  counts: { applications: number; campaigns: number };
  user: { name: string; handle: string | null };
  isAdmin: boolean;
}

/**
 * Everything the signed-in chrome needs. Shared by the app layout and the
 * browse layout, so /jobs can render inside the app shell for a signed-in
 * visitor and inside the marketing chrome for everyone else — clicking
 * "Browse jobs" in the sidebar shouldn't throw you out of the app.
 */
export async function getShellData(): Promise<ShellData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      signedIn: false,
      counts: { applications: 0, campaigns: 0 },
      user: { name: "", handle: null },
      isAdmin: false,
    };
  }

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, name, handle")
    .eq("user_id", user.id)
    .maybeSingle();

  const [applications, campaigns, adminCheck] = await Promise.all([
    applicant
      ? supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", applicant.id)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    applicant
      ? supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", applicant.id)
          .in("status", ["active", "submitted"])
      : Promise.resolve({ count: 0 }),
    supabase.rpc("is_admin"),
  ]);

  return {
    signedIn: true,
    counts: {
      applications: applications.count ?? 0,
      campaigns: campaigns.count ?? 0,
    },
    user: {
      name: applicant?.name ?? user.email?.split("@")[0] ?? "You",
      handle: applicant?.handle ?? null,
    },
    isAdmin: Boolean(adminCheck.data),
  };
}
