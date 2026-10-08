import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  discordOrigin,
  discordRedirectUri,
  parseDiscordUser,
  verifyState,
} from "@/lib/discord";

const BACK = "/dashboard/recruiting/profile-setup";

/**
 * Step 2: Discord sends the creator back with a one-time code. We check the sign-in is
 * genuine (signed by us, not expired, started in this browser, by this same creator),
 * swap the code for a short-lived token, ask Discord who it is, and save the answer.
 * The token is used once and thrown away: we never store it.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = discordOrigin(request.url);
  const done = (result: string) => {
    const res = NextResponse.redirect(
      new URL(`${BACK}?discord=${result}`, origin),
    );
    res.cookies.set("discord_oauth", "", { path: "/api/discord", maxAge: 0 });
    return res;
  };

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return done("unavailable");

  // The creator said no on Discord's screen.
  if (url.searchParams.get("error")) return done("cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return done("failed");

  const checked = verifyState(clientSecret, state);
  if (!checked.ok) return done("failed");

  // Started in this browser: the one-time value in the cookie has to match the one in the state.
  const cookieNonce = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)discord_oauth=([^;]+)/)?.[1];
  if (!cookieNonce || cookieNonce !== checked.payload.nonce)
    return done("failed");

  // And finished by the same signed-in creator who started it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== checked.payload.uid) return done("failed");

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: discordRedirectUri(origin),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!tokenRes.ok) return done("failed");
    const { access_token } = (await tokenRes.json()) as {
      access_token?: string;
    };
    if (!access_token) return done("failed");

    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(15_000),
    });
    const discordUser = meRes.ok ? parseDiscordUser(await meRes.json()) : null;

    // Done with the token: tell Discord to void it. Best effort.
    void fetch("https://discord.com/api/oauth2/token/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: access_token,
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});

    if (!discordUser) return done("failed");

    // Written with the service role: the database stops creators writing these two fields themselves.
    const { error } = await createAdminClient()
      .from("applicants")
      .update({
        discord_id: discordUser.id,
        discord_username: discordUser.username,
      })
      .eq("user_id", user.id);
    if (error) return done(error.code === "23505" ? "taken" : "failed");

    return done("connected");
  } catch (err) {
    console.error("discord callback failed:", (err as Error).message);
    return done("failed");
  }
}
