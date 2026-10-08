import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  discordAuthorizeUrl,
  discordOrigin,
  discordRedirectUri,
  signState,
  STATE_MINUTES,
} from "@/lib/discord";

const BACK = "/dashboard/recruiting/profile-setup";

/**
 * Step 1 of "Connect Discord": a signed-in creator is sent to Discord to confirm who they
 * are. The sign-in is tied to this browser (a one-time value in a cookie, also inside the
 * signed state) and to this creator, and expires after a few minutes.
 */
export async function GET(request: Request) {
  const origin = discordOrigin(request.url);
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    return NextResponse.redirect(
      new URL(`${BACK}?discord=unavailable`, origin),
    );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.redirect(new URL(`/login?next=${BACK}`, origin));

  // RLS: a creator reads only their own profile. No profile yet means nothing to attach it to.
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant)
    return NextResponse.redirect(
      new URL(`${BACK}?discord=profile-first`, origin),
    );

  const nonce = randomBytes(16).toString("hex");
  const state = signState(clientSecret, {
    uid: user.id,
    nonce,
    exp: Date.now() + STATE_MINUTES * 60_000,
  });

  const res = NextResponse.redirect(
    discordAuthorizeUrl({
      clientId,
      redirectUri: discordRedirectUri(origin),
      state,
    }),
  );
  res.cookies.set("discord_oauth", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/discord",
    maxAge: STATE_MINUTES * 60,
  });
  return res;
}
