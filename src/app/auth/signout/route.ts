import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeLocalPath } from "@/lib/safe-path";

// POST counterpart to /logout (which is GET, for plain links) — this
// exists for CreatorRoster's ported chrome (Phase 3/4), which submits a
// form rather than linking directly.
//
// `next` lets a caller choose where to land (the admin panel sends people to
// the login page, not the public site). Same-site paths only: an absolute URL
// here would be an open redirect.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  let next: unknown = null;
  try {
    next = (await request.formData()).get("next");
  } catch {
    // No form body: fall back to the home page.
  }
  return NextResponse.redirect(new URL(safeLocalPath(next, "/"), request.url), { status: 303 });
}
