import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dodo } from "@/lib/dodo";
import { fulfillPurchase } from "@/lib/fulfillment";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

/**
 * Where Dodo's hosted checkout sends the browser back after payment
 * (see api/checkout/dodo's redirect_url). Dodo appends `payment_id` and
 * `status` to this URL itself, but — same principle as the Stripe
 * confirm route this replaced — those are just an unauthenticated hint
 * from the browser. The actual authority is re-fetching the payment
 * from Dodo's own API and checking what it says.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("payment_id");

  if (!dodo || !paymentId) {
    return NextResponse.redirect(new URL("/checkout?error=missing_payment", request.url));
  }

  const payment = await dodo.payments.retrieve(paymentId);
  if (payment.status !== "succeeded") {
    return NextResponse.redirect(new URL("/checkout?error=payment_incomplete", request.url));
  }

  const email = payment.customer?.email;
  if (!email) {
    console.error("Dodo payment succeeded with no customer email:", payment.payment_id);
    return NextResponse.redirect(new URL("/checkout?error=missing_email", request.url));
  }

  const result = await fulfillPurchase({ email, provider: "dodo", reference: payment.payment_id });
  if (!result.ok) {
    console.error("Dodo fulfillment failed:", result.error);
    return NextResponse.redirect(new URL("/checkout?error=fulfillment_failed", request.url));
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email.toLowerCase(), SESSION_COOKIE_OPTIONS);

  return NextResponse.redirect(new URL("/checkout/success", request.url));
}
