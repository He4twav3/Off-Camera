import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Signed-in only. The training->recruiting gate (finish the course before you
// can browse or apply to campaigns) now lives in jobs/layout.tsx, so a new
// creator can open their dashboard and finish the profile wizard straight
// after signing up — signup sends them here — without having to complete the
// course first.
//
// No nav of its own — dashboard/layout.tsx's sidebar covers this section too.
export default async function RecruitingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/recruiting");

  return <>{children}</>;
}
