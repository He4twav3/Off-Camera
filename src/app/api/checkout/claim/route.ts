import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyEmailToken } from "@/lib/users";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

/**
 * Where the "You're in" purchase-confirmation email's button points
 * (see welcome-purchase-email.tsx, sent from fulfillment.ts). Exists
 * specifically for NOWPayments buyers: crypto fulfillment happens purely
 * from a server-to-server IPN webhook with no browser present to set a
 * session cookie on, unlike Stripe's confirm route (api/checkout/stripe/
 * confirm), which has the browser right there. Reuses the same verify
 * token as /verify-email — presenting it here does double duty (confirms
 * the email AND signs in), since owning that token already proves the
 * same thing either way: this inbox belongs to whoever's checking it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  if (!email || !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const result = await verifyEmailToken(email, token);
  if (!result.ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("claimError", result.error);
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
