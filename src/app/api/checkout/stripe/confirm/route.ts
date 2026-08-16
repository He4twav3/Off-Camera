import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { fulfillPurchase } from "@/lib/fulfillment";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

/**
 * Where Stripe's confirmPayment() sends the browser back after a card is
 * confirmed (see stripe-card-panel.tsx's return_url). A route handler,
 * not a page — setting the session cookie requires one; a plain Server
 * Component can't mutate cookies during render.
 *
 * Re-fetches the PaymentIntent from Stripe's own API rather than trusting
 * the query string's redirect_status: the query params are just an
 * unauthenticated hint from the browser, the actual authority is what
 * Stripe's API says when asked directly. fulfillPurchase() is idempotent,
 * so it doesn't matter whether this races with (or loses to) the Stripe
 * webhook — either way this route still sets the cookie itself, since
 * the webhook has no browser to do that part.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentIntentId = url.searchParams.get("payment_intent");

  if (!stripe || !paymentIntentId) {
    return NextResponse.redirect(new URL("/checkout?error=missing_payment", request.url));
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") {
    return NextResponse.redirect(new URL("/checkout?error=payment_incomplete", request.url));
  }

  const email = intent.metadata.email;
  if (!email) {
    console.error("Stripe PaymentIntent succeeded with no email in metadata:", intent.id);
    return NextResponse.redirect(new URL("/checkout?error=missing_email", request.url));
  }

  const result = await fulfillPurchase({ email, provider: "stripe", reference: intent.id });
  if (!result.ok) {
    console.error("Stripe fulfillment failed:", result.error);
    return NextResponse.redirect(new URL("/checkout?error=fulfillment_failed", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  return NextResponse.redirect(new URL("/checkout/success", request.url));
}
