import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@dodopayments/nextjs";
import { fulfillPurchase } from "@/lib/fulfillment";
import { revokeUserAccess } from "@/lib/users";

/**
 * The authoritative fulfillment path — unlike the browser's confirm
 * route (api/checkout/dodo/confirm), this fires even if the buyer
 * closes the tab right after paying. fulfillPurchase() is idempotent,
 * so it doesn't matter whether this races with, precedes, or follows
 * the confirm route — whichever runs first does the real work.
 *
 * Path matches the convention @dodopayments/nextjs's own docs use
 * (app/api/webhook/dodo-payments/route.ts) — not required, but no
 * reason to diverge from it.
 *
 * Webhooks() itself validates/prepares the signing key the moment it's
 * called (not lazily per-request) — an unset or malformed
 * DODO_PAYMENTS_WEBHOOK_SECRET throws right here at module load, which
 * would otherwise take the whole production build down with it. Every
 * other integration in this app degrades to "not configured" instead of
 * crashing (see mailer.ts, nowpayments.ts, dodo.ts), so this catches
 * that and does the same instead of trusting the env var blindly.
 */
function buildHandler() {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_SECRET) return null;
  try {
    return Webhooks({
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
      onPaymentSucceeded: async (payload) => {
        const email = payload.data.customer.email;
        const result = await fulfillPurchase({
          email,
          provider: "dodo",
          reference: payload.data.payment_id,
        });
        if (!result.ok) {
          console.error("Dodo webhook fulfillment failed:", result.error);
        }
      },
      // Refunds don't currently self-serve — this is Dodo notifying us
      // one happened (initiated from their dashboard/support flow), not
      // us initiating it. Re-locks the dashboard immediately instead of
      // access silently outliving the payment that granted it.
      onRefundSucceeded: async (payload) => {
        const email = payload.data.customer.email;
        const result = await revokeUserAccess(email);
        if (!result.ok) {
          console.error("Dodo webhook refund-revocation failed:", result.error);
        }
      },
    });
  } catch (err) {
    console.error("Dodo webhook handler misconfigured (bad DODO_PAYMENTS_WEBHOOK_SECRET?):", err);
    return null;
  }
}

const handler = buildHandler();

export async function POST(request: NextRequest) {
  if (!handler) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  return handler(request);
}
