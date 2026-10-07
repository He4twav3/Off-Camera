import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { adminHostDecision, EDGE_HEADER } from "@/lib/admin-host";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same mechanism, this
// is the current file convention, not the deprecated one.
//
// Route protection + admin gating both live in updateSession() now (see
// lib/supabase/proxy.ts) — this file just has to run broadly, not only on
// /dashboard/login/signup like the old cookie-based version did, because
// updateSession() also refreshes the Supabase auth token on every request,
// which every page needs regardless of whether it's protected.
//
// First, though: if the admin panel has its own address (ADMIN_HOST, see
// lib/admin-host.ts), decide whether this request belongs on this address at
// all, before anything else runs.
export function proxy(request: NextRequest) {
  const decision = adminHostDecision({
    host: request.headers.get("host"),
    path: request.nextUrl.pathname,
    adminHost: process.env.ADMIN_HOST,
    edgeHeader: request.headers.get(EDGE_HEADER),
    edgeSecret: process.env.ADMIN_EDGE_SECRET,
  });
  if (decision.action === "notfound") return new NextResponse("Not found", { status: 404 });
  if (decision.action === "redirect") return NextResponse.redirect(new URL(decision.to, request.url));
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
