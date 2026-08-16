import { NextResponse } from "next/server";
import { nowPayments } from "@/lib/nowpayments";
import { fulfillPurchase } from "@/lib/fulfillment";
import { siteConfig } from "@/lib/site-config";

/**
 * The only fulfillment path for crypto — unlike Stripe, there's no
 * reliable synchronous browser confirmation to also rely on: crypto
 * payments settle on-chain, which takes real time, so the buyer is often
 * long gone from the browser tab by the time this actually fires. See
 * the claim route (api/checkout/claim) for how they get signed in
 * without ever being present for it.
 */
export async function POST(request: Request) {
  if (!nowPayments) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-nowpayments-sig");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let event;
  try {
    // Verifies x-nowpayments-sig itself (HMAC-SHA512 over the
    // recursively-sorted payload) and throws if it doesn't match —
    // unlike Stripe, this signs the parsed object, not raw bytes, so
    // request.json() here (rather than .text()) is correct.
    event = nowPayments.parseWebhook(payload, signature);
  } catch (err) {
    console.error("NOWPayments webhook signature invalid:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "payment.status_changed" || event.payment.status !== "paid") {
    // Not a final "paid" state yet (pending/processing/etc) —
    // acknowledge without fulfilling; NOWPayments sends another callback
    // as the payment progresses toward (or away from) completion.
    return NextResponse.json({ received: true });
  }

  const { payment } = event;
  const email = payment.order_id;
  if (!email) {
    console.error("NOWPayments webhook has no order_id/email:", payment.payment_id);
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  // Defense in depth: confirm what was actually paid matches the real
  // course price, not just trusting the webhook blindly.
  const expectedCurrency = siteConfig.price.currency.toLowerCase();
  const paidCurrency = payment.price_currency?.toLowerCase();
  const paidAmount = payment.price_amount ?? 0;
  if (paidCurrency !== expectedCurrency || paidAmount < siteConfig.price.amount - 0.01) {
    console.error("NOWPayments webhook amount/currency mismatch:", payment);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const result = await fulfillPurchase({
    email,
    provider: "nowpayments",
    reference: payment.payment_id ?? "unknown",
  });
  if (!result.ok) {
    console.error("NOWPayments webhook fulfillment failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
