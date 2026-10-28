"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { testPushAction, type WhatsAppState } from "./whatsapp-actions";

function Test() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
      {pending ? "Sending…" : "Send a test"}
    </button>
  );
}

/** Phone notifications through the free ntfy app: subscribe to this private channel, then send a test. */
export function PushForm({ topic }: { topic: string | null }) {
  const [state, action] = useActionState<WhatsAppState>(testPushAction, {});
  return (
    <section className="mt-8 rounded-xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">Phone notifications</h2>
      <p className="mt-1 text-sm text-muted-foreground">A notification on your phone for every new creator, brand and campaign application.</p>
      {topic ? (
        <>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Install the free <strong className="text-foreground">ntfy</strong> app (App Store or Google Play).
            </li>
            <li>Tap +, and subscribe to this channel name:</li>
          </ol>
          <p className="mt-2 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm break-all text-foreground select-all">{topic}</p>
          <p className="mt-1 text-xs text-muted-foreground">Keep it to yourself: anyone with this name could read the alerts.</p>
          <form action={action} className="mt-4 flex flex-col gap-2">
            <div>
              <Test />
            </div>
            {state.error && <p className="text-sm font-semibold text-destructive">{state.error}</p>}
            {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
          </form>
        </>
      ) : (
        <p className="mt-3 text-sm text-destructive">The channel couldn&apos;t be made. Reload the page.</p>
      )}
    </section>
  );
}
