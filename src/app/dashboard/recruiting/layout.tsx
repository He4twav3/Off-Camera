import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// Signed-in only. The course is optional: nothing here waits on it, so a new
// creator can finish the profile wizard straight after signing up — signup
// sends them here — and then browse and apply to campaigns.
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
