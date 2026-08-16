import { NextResponse } from "next/server";
import { dodo, DODO_PRODUCT_ID, dodoCheckoutBaseUrl } from "@/lib/dodo";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Where the checkout page's "Continue to secure checkout" (card) button
 * points. Not built with @dodopayments/nextjs's Checkout() helper on
 * purpose — that factory bakes `returnUrl` in at module-load time from
 * a static env var, but this app runs from several different origins
 * (localhost, a LAN IP, the real deploy) and needs the same
 * per-request origin detection every other checkout route already uses
 * (see request-url.ts) — so this builds the same redirect Checkout()
 * would, just with a dynamic return URL instead of a fixed one.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!dodo || !DODO_PRODUCT_ID) {
    return NextResponse.redirect(new URL("/checkout?error=card_not_configured", request.url));
  }
  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL("/checkout?error=missing_email", request.url));
  }

  const baseUrl = await getBaseUrl();
  const checkoutUrl = new URL(`${dodoCheckoutBaseUrl()}/buy/${DODO_PRODUCT_ID}`);
  checkoutUrl.searchParams.set("quantity", "1");
  checkoutUrl.searchParams.set("email", email.trim().toLowerCase());
  checkoutUrl.searchParams.set("redirect_url", `${baseUrl}/api/checkout/dodo/confirm`);

  return NextResponse.redirect(checkoutUrl);
}
