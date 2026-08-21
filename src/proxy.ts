import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same mechanism, this
// is the current file convention, not the deprecated one.
//
// Route protection + admin gating both live in updateSession() now (see
// lib/supabase/proxy.ts) — this file just has to run broadly, not only on
// /dashboard/login/signup like the old cookie-based version did, because
// updateSession() also refreshes the Supabase auth token on every request,
// which every page needs regardless of whether it's protected.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
