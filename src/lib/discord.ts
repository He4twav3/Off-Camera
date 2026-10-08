import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Connecting a Discord account: the creator signs in with Discord, Discord tells us who
 * they are, and we save that. Nothing about it is typed in by the creator.
 *
 * Only the "identify" permission is asked for: their Discord id and name, nothing else.
 * No messages, no servers, and we can't post as them.
 *
 * Pure helpers (no network, no database) so the checks that matter, above all that a
 * sign-in can't be replayed, forged or finished by someone else, can be tested.
 */

export const DISCORD_SCOPE = "identify";
/** How long a sign-in attempt stays valid. */
export const STATE_MINUTES = 10;

export function discordAuthorizeUrl(p: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const q = new URLSearchParams({
    client_id: p.clientId,
    response_type: "code",
    redirect_uri: p.redirectUri,
    scope: DISCORD_SCOPE,
    state: p.state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${q}`;
}

export type StatePayload = { uid: string; nonce: string; exp: number };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (secret: string, body: string) =>
  createHmac("sha256", secret)
    .update(`discord-oauth-v1.${body}`)
    .digest("base64url");

/** A tamper-proof "state": who is signing in, a one-time value tied to their browser, and when it expires. */
export function signState(secret: string, payload: StatePayload): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(secret, body)}`;
}

export type StateCheck =
  | { ok: true; payload: StatePayload }
  | { ok: false; reason: "malformed" | "forged" | "expired" };

export function verifyState(
  secret: string,
  state: string,
  now: Date = new Date(),
): StateCheck {
  const [body, mac, extra] = state.split(".");
  if (!body || !mac || extra !== undefined)
    return { ok: false, reason: "malformed" };

  const want = Buffer.from(sign(secret, body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got))
    return { ok: false, reason: "forged" };

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof payload?.uid !== "string" ||
    typeof payload?.nonce !== "string" ||
    typeof payload?.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (now.getTime() > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

/** What Discord sends back for "who is this", reduced to the two fields we keep. */
export function parseDiscordUser(
  json: unknown,
): { id: string; username: string } | null {
  if (!json || typeof json !== "object") return null;
  const u = json as Record<string, unknown>;
  const id = typeof u.id === "string" ? u.id : "";
  const username =
    typeof u.username === "string" ? u.username.trim().toLowerCase() : "";
  if (!/^[0-9]{5,25}$/.test(id)) return null;
  // Discord's current usernames are 2-32 lowercase letters, numbers, underscores and full stops.
  if (!/^[a-z0-9_.]{2,32}$/.test(username)) return null;
  return { id, username };
}

/** The address Discord sends the creator back to. Must match the one set in the Discord app. */
export function discordRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/api/discord/callback`;
}

/**
 * The site's own address, for the Discord return trip. It is the configured site address,
 * unless that is missing or still points at a local machine (a live site left on
 * "http://localhost:3000" would send Discord to the wrong place); then it is the address
 * this request actually came to.
 */
export function discordOrigin(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configured))
    return configured;
  return new URL(requestUrl).origin;
}
