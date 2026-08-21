import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";

// Real training->recruiting gate — not just the dashboard's completion CTA,
// which someone could ignore by typing this URL directly. Mirrors the
// paid-gate pattern already established in dashboard/page.tsx: check the
// same server-side fact the UI nudge is based on, redirect with an
// explanation rather than silently 404 or bounce with no context.
//
// Chrome here is still the plain nav from Phase 2/3, not yet folded into
// a full sidebar shell (Phase 4's dashboard-chrome item) — deliberately
// deferred since it's a visual nice-to-have, not part of the handoff
// logic this phase is actually about.
export default async function RecruitingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/recruiting");

  const { isComplete } = await getDashboardProgress();
  if (!isComplete) {
    redirect("/dashboard?reason=finish_course_first");
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-4 border-b border-border pb-4 text-sm font-semibold">
        <Link href="/dashboard/recruiting">Recruiting home</Link>
        <Link href="/dashboard/recruiting/jobs">Jobs</Link>
        <Link href="/dashboard/recruiting/profile-setup">Profile</Link>
      </nav>
      {children}
    </div>
  );
}
