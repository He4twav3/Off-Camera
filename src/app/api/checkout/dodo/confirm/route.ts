import { NextResponse } from "next/server";
import { dodo } from "@/lib/dodo";
import { fulfillPurchase } from "@/lib/fulfillment";

/**
 * Where Dodo's hosted checkout sends the browser back after payment
 * (see api/checkout/dodo's redirect_url). Dodo appends `payment_id` and
 * `status` to this URL itself, but those are just an unauthenticated
 * hint from the browser — the actual authority is re-fetching the
 * payment from Dodo's own API and checking what it says.
 *
 * This route deliberately does NOT sign the browser in. It used to redirect
 * to a magic link for the payment's email, which meant anyone who obtained a
 * payment id (from a receipt, a shared URL, browser history) could be signed
 * in as the buyer. Now it only records the purchase and sends the browser to
 * /checkout/success; a brand-new buyer gets their sign-in link by EMAIL from
 * fulfillPurchase (lib/fulfillment.ts), and an existing account logs in
 * normally.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("payment_id");

  if (!dodo || !paymentId) {
    return NextResponse.redirect(new URL("/checkout?error=missing_payment", request.url));
  }

  let payment;
  try {
    payment = await dodo.payments.retrieve(paymentId);
  } catch (err) {
    console.error("Dodo confirm: could not retrieve payment:", err);
    return NextResponse.redirect(new URL("/checkout?error=missing_payment", request.url));
  }
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

  return NextResponse.redirect(new URL("/checkout/success", request.url));
}
