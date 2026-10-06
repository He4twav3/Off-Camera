import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface ShellData {
  signedIn: boolean;
  session: { displayName: string; email: string; initials: string } | null;
  recruiting: { applications: number; campaigns: number };
  isAdmin: boolean;
}

/**
 * Everything the signed-in dashboard shell needs — one query for both the
 * campaigns side and the course side, since they share one sidebar. The course
 * is optional, so nothing here depends on how far through it anyone is.
 */
export async function getShellData(): Promise<ShellData> {
  const session = await getSession();
  if (!session) {
    return {
      signedIn: false,
      session: null,
      recruiting: { applications: 0, campaigns: 0 },
      isAdmin: false,
    };
  }

  const supabase = await createClient();

  const [applicant, adminCheck] = await Promise.all([
    supabase.from("applicants").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(),
    supabase.rpc("is_admin"),
  ]);

  const [applications, campaigns] = await Promise.all([
    applicant.data
      ? supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", applicant.data.id)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    applicant.data
      ? supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("applicant_id", applicant.data.id)
          .in("status", ["active", "submitted"])
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    signedIn: true,
    session: {
      displayName: session.displayName,
      email: session.email,
      initials: session.initials,
    },
    recruiting: {
      applications: applications.count ?? 0,
      campaigns: campaigns.count ?? 0,
    },
    isAdmin: Boolean(adminCheck.data),
  };
}
