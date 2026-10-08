import { discordAuthorizeUrl, discordRedirectUri, parseDiscordUser, signState, verifyState, STATE_MINUTES } from "../src/lib/discord";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const secret = "test-secret-one";
const now = new Date("2026-10-08T12:00:00Z");
const payload = { uid: "11111111-1111-1111-1111-111111111111", nonce: "abc123", exp: now.getTime() + STATE_MINUTES * 60_000 };

// --- the sign-in link ----------------------------------------------------------------------
const url = new URL(discordAuthorizeUrl({ clientId: "123", redirectUri: "https://www.oncameraugc.com/api/discord/callback", state: "xyz" }));
t("goes to Discord", url.origin === "https://discord.com" && url.pathname === "/oauth2/authorize", url.href);
t("asks only to identify", url.searchParams.get("scope") === "identify");
t("asks for a code, not a token", url.searchParams.get("response_type") === "code");
t("carries the state and our address back", url.searchParams.get("state") === "xyz" && url.searchParams.get("redirect_uri") === "https://www.oncameraugc.com/api/discord/callback");
t("the return address is built from the site address", discordRedirectUri("https://www.oncameraugc.com/") === "https://www.oncameraugc.com/api/discord/callback");

// --- the state: forged, tampered, expired, wrong secret -----------------------------------------
const good = signState(secret, payload);
const ok = verifyState(secret, good, now);
t("a fresh state is accepted and gives back who and which nonce", ok.ok && ok.payload.uid === payload.uid && ok.payload.nonce === "abc123", ok);
t("a state signed with another secret is forged", (verifyState("another-secret", good, now) as { reason: string }).reason === "forged");
t("a state with the payload changed is forged", (() => { const [, mac] = good.split("."); const evil = Buffer.from(JSON.stringify({ ...payload, uid: "22222222-2222-2222-2222-222222222222" })).toString("base64url"); return (verifyState(secret, `${evil}.${mac}`, now) as { reason: string }).reason === "forged"; })());
t("a state with the signature changed is forged", (verifyState(secret, `${good.split(".")[0]}.AAAA`, now) as { reason: string }).reason === "forged");
t("a state with no signature is malformed", (verifyState(secret, good.split(".")[0], now) as { reason: string }).reason === "malformed");
t("rubbish is malformed", (verifyState(secret, "not a state", now) as { reason: string }).reason !== undefined && !verifyState(secret, "not a state", now).ok);
t("empty is refused", !verifyState(secret, "", now).ok);
t("an expired state is refused", (verifyState(secret, good, new Date(payload.exp + 1)) as { reason: string }).reason === "expired");
t("exactly at the limit is still fine", verifyState(secret, good, new Date(payload.exp)).ok);
t("a signed state with the wrong shape is refused", (() => { const body = Buffer.from(JSON.stringify({ hello: 1 })).toString("base64url"); const withMac = signState(secret, { hello: 1 } as never); return !verifyState(secret, withMac, now).ok && body.length > 0; })());

// --- reading Discord's answer ------------------------------------------------------------------------
t("a normal Discord user", JSON.stringify(parseDiscordUser({ id: "80351110224678912", username: "Maria_UGC", global_name: "Maria" })) === JSON.stringify({ id: "80351110224678912", username: "maria_ugc" }));
t("an id that isn't digits is refused", parseDiscordUser({ id: "abc", username: "maria" }) === null);
t("an id given as a number is refused (precision loss)", parseDiscordUser({ id: 80351110224678912, username: "maria" }) === null);
t("a name with spaces is refused", parseDiscordUser({ id: "80351110224678912", username: "maria ugc" }) === null);
t("no name is refused", parseDiscordUser({ id: "80351110224678912" }) === null);
t("not an object is refused", parseDiscordUser("hi") === null && parseDiscordUser(null) === null);

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
