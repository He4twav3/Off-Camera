import type { ReactNode } from "react";
import { getDashboardProgress } from "@/lib/progress";
import { redirect } from "next/navigation";

// The real training->recruiting gate — not just the dashboard's completion
// CTA or the sidebar's locked state, either of which someone could ignore by
// typing this URL directly. Browsing and applying to campaigns requires the
// course to be finished; the creator dashboard and profile wizard (the rest of
// /dashboard/recruiting) do not. Check the same server-side fact the UI nudge
// is based on and redirect with an explanation.
export default async function JobsLayout({ children }: { children: ReactNode }) {
  const { isComplete } = await getDashboardProgress();
  if (!isComplete) {
    redirect("/dashboard?reason=finish_course_first");
  }
  return <>{children}</>;
}
