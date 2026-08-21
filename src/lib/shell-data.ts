import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";

export interface ShellData {
  signedIn: boolean;
  session: { displayName: string; email: string; initials: string } | null;
  /** Course-completion gate — mirrors dashboard/recruiting/layout.tsx's own
   * check exactly, so the sidebar never shows the recruiting section as
   * open when the route itself would bounce you back out. */
  courseComplete: boolean;
  recruiting: { applications: number; campaigns: number };
  isAdmin: boolean;
}

/**
 * Everything the signed-in dashboard shell needs — one query for both the
 * course side and the recruiting side, since they now share one sidebar.
 * Recruiting's own counts only matter once the section is actually
 * unlocked, so those queries are skipped entirely for anyone still working
 * through the course.
 */
export async function getShellData(): Promise<ShellData> {
  const session = await getSession();
  if (!session) {
    return {
      signedIn: false,
      session: null,
      courseComplete: false,
      recruiting: { applications: 0, campaigns: 0 },
      isAdmin: false,
    };
  }

  const { isComplete } = await getDashboardProgress();
  const supabase = await createClient();

  const [applicant, adminCheck] = await Promise.all([
    isComplete
      ? supabase.from("applicants").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle()
      : Promise.resolve({ data: null }),
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
    courseComplete: isComplete,
    recruiting: {
      applications: applications.count ?? 0,
      campaigns: campaigns.count ?? 0,
    },
    isAdmin: Boolean(adminCheck.data),
  };
}
