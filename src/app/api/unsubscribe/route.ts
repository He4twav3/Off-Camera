import { unsubscribe, validUnsubscribe } from "@/lib/email-reminders";

/**
 * The unsubscribe link at the bottom of the reminder emails (GET, from the link) and mail apps' one-click
 * unsubscribe button (POST, from the List-Unsubscribe header). The link is signed per address.
 */
async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const email = url.searchParams.get("e") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const ok = email && token && validUnsubscribe(email, token) && (await unsubscribe(email));
  const message = ok ? "You're unsubscribed. You won't get these reminder emails again." : "That link didn't work. Reply to any of our emails and we'll take you off the list.";
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unsubscribe</title></head><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;color:#16151a"><h1 style="font-size:22px">OnCamera</h1><p style="font-size:16px;line-height:1.6">${message}</p></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const GET = handle;
export const POST = handle;
