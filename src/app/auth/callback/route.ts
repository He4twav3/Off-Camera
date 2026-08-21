import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the email confirmation link, the password-recovery link, and
// the passwordless magic-sign-in link used after a payment confirms
// (see lib/fulfillment.ts and api/checkout/dodo/confirm).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";

  // Only same-site redirects — an absolute URL here would make this an
  // open redirect.
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  // Supabase reports its own failures on the query string (expired link,
  // already used, etc.). Pass the human-readable reason through rather
  // than swallowing it into a generic code.
  const supabaseError = searchParams.get("error_description");
  if (supabaseError) {
    return NextResponse.redirect(
      `${origin}/login?reason=${encodeURIComponent(supabaseError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?reason=${encodeURIComponent("That link was missing its confirmation code. Try requesting a new one.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The usual cause is opening the link in a different browser from
    // the one that started the flow — the PKCE verifier lives in a
    // cookie there. Say so, rather than showing a bare error code.
    return NextResponse.redirect(
      `${origin}/login?reason=${encodeURIComponent(
        "That link couldn't be used. It may have expired, already been used, or been opened in a different browser from the one you started in. Request a new one and open it in the same browser.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
