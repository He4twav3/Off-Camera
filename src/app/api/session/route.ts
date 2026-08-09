import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Tiny JSON endpoint so the marketing navbar can show real login/logout
 * state without forcing every static marketing page to render dynamically.
 * Reading the session cookie directly in a shared layout/navbar server
 * component makes Next treat the whole page tree as dynamic (cookies()
 * opts out of static generation) — costly for pages that otherwise don't
 * need it. Fetching this from the client keeps the marketing pages static
 * while the auth state still resolves for real, just a beat after hydration.
 */
export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    session
      ? { loggedIn: true, email: session.email, initials: session.initials }
      : { loggedIn: false }
  );
}
