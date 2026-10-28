"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveWhatsAppAction, type WhatsAppState } from "./whatsapp-actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
      {pending ? "Sending a test…" : "Save and send a test"}
    </button>
  );
}

/** Your WhatsApp number and CallMeBot key, for alerts on every new signup and application. */
export function WhatsAppForm({ phone, on }: { phone: string; on: boolean }) {
  const [state, action] = useActionState<WhatsAppState, FormData>(saveWhatsAppAction, {});
  const input = "mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground";
  return (
    <section className="mt-8 rounded-xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">WhatsApp alerts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A WhatsApp message to you for every new creator, brand and campaign application. {on ? "On." : "Off."}
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Open{" "}
          <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">
            CallMeBot&apos;s page
          </a>{" "}
          and save its WhatsApp number in your contacts.
        </li>
        <li>From your WhatsApp, send it: I allow callmebot to send me messages</li>
        <li>It replies with your key. Paste it below with your number.</li>
      </ol>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <label className="text-sm text-muted-foreground">
          Your WhatsApp number
          <input name="phone" defaultValue={phone} placeholder="+447700900123" inputMode="tel" className={input} />
        </label>
        <label className="text-sm text-muted-foreground">
          CallMeBot key
          <input name="apikey" placeholder="123456" autoComplete="off" className={input} />
        </label>
        {state.error && <p className="text-sm font-semibold text-destructive">{state.error}</p>}
        {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
        <div className="flex items-center gap-4">
          <Save />
          {on && (
            <button type="submit" name="off" value="1" className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
              Turn off
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
