import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST counterpart to /logout (which is GET, for plain links) — this
// exists for CreatorRoster's ported chrome (Phase 3/4), which submits a
// form rather than linking directly.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
