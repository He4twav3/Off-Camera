import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillPurchase } from "@/lib/fulfillment";

/**
 * The authoritative fulfillment path — unlike the browser's confirm
 * route (api/checkout/stripe/confirm), this fires even if the buyer
 * closes the tab the instant payment clears, and doesn't depend on
 * anything the browser does or doesn't do. fulfillPurchase() is
 * idempotent, so this firing before, after, or racing with the confirm
 * route is always safe — whichever runs first does the real work.
 */
export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the exact raw bytes Stripe signed —
  // request.text() (not request.json(), which would re-serialize and
  // change them) is what preserves that.
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature invalid:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const email = intent.metadata.email;
    if (!email) {
      console.error("Stripe webhook: payment_intent.succeeded with no email:", intent.id);
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const result = await fulfillPurchase({ email, provider: "stripe", reference: intent.id });
    if (!result.ok) {
      console.error("Stripe webhook fulfillment failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
