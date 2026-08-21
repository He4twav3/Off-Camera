import { NextResponse } from "next/server";
import { dodo } from "@/lib/dodo";
import { fulfillPurchase } from "@/lib/fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/request-url";

/**
 * Where Dodo's hosted checkout sends the browser back after payment
 * (see api/checkout/dodo's redirect_url). Dodo appends `payment_id` and
 * `status` to this URL itself, but those are just an unauthenticated
 * hint from the browser — the actual authority is re-fetching the
 * payment from Dodo's own API and checking what it says.
 *
 * Signing the browser in is now a redirect to a real Supabase magic
 * link (generateLink) rather than hand-setting a cookie — Supabase
 * sessions are real signed GoTrue JWTs, not something this route can
 * construct itself. Lands on /auth/confirm (a client component), not
 * /auth/callback — admin.generateLink() always produces an
 * implicit-flow link, incompatible with /auth/callback's PKCE-only
 * `?code=` handling. See auth/confirm/page.tsx's own comment.
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

  const baseUrl = await getBaseUrl();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: email.toLowerCase(),
    options: { redirectTo: `${baseUrl}/auth/confirm?next=/checkout/success` },
  });

  if (error || !data.properties?.action_link) {
    // Payment + account are still real even if this specific redirect
    // can't be built — send them to sign in manually instead of
    // stranding them on an error page for something that isn't really
    // a failure.
    console.error("Dodo confirm: could not generate sign-in link:", error);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("email", email);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(data.properties.action_link);
}
