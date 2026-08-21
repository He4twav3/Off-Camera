import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";

// Real training->recruiting gate — not just the dashboard's completion CTA
// or the sidebar's locked state, either of which someone could ignore by
// typing this URL directly. Mirrors the paid-gate pattern already
// established in dashboard/page.tsx: check the same server-side fact the
// UI nudge is based on, redirect with an explanation rather than silently
// 404 or bounce with no context.
//
// No nav of its own anymore — dashboard/layout.tsx's sidebar covers this
// section now too, recruiting is just a part of the one shell rather than
// a second chrome nested inside it.
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

  return <>{children}</>;
}
