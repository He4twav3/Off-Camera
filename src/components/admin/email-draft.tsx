"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Mail } from "lucide-react";
import { markEmailedAction, type MarkState } from "@/app/admin/payout-details/actions";
import { mailtoHref } from "@/lib/payment-emails";

function MarkButton({ label = "Mark as sent" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * One ready-written email. Edit anything, copy it or open it in your own email app, then press
 * "Mark as sent" so your partner can see it is done. After that it shows who sent it and when.
 */
export function EmailDraft({
  title,
  initial,
  kind,
  ids,
  sent,
}: {
  title: string;
  initial: { to: string; subject: string; body: string };
  kind: "brand" | "creator";
  ids: string[];
  sent: { by: string; at: string } | null;
}) {
  const [to, setTo] = useState(initial.to);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState<MarkState, FormData>(markEmailedAction, {});
  const done =
    state.success === "undone"
      ? null
      : (sent ?? (state.success === "sent" ? { by: "you", at: new Date().toISOString() } : null));

  async function copy() {
    try {
      await navigator.clipboard.writeText(`To: ${to}\nSubject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
        {done && (
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
            Sent by {done.by} on {new Date(done.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-muted-foreground">To</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5" />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-muted-foreground">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5" />
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={Math.min(22, body.split("\n").length + 2)}
          className="w-full rounded-md border border-border bg-background px-2 py-2 font-sans leading-relaxed"
          aria-label="Email body"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={mailtoHref({ to, subject, body })}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <Mail className="size-4" />
          Open in my email app
        </a>
        <button type="button" onClick={copy} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy email"}
        </button>
        <form action={action} className="ml-auto">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="ids" value={ids.join(",")} />
          {done ? (
            <>
              <input type="hidden" name="mode" value="undo" />
              <button type="submit" className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Undo
              </button>
            </>
          ) : (
            <MarkButton />
          )}
        </form>
      </div>
      {state.error && <p className="mt-2 text-sm font-semibold text-destructive">{state.error}</p>}
    </section>
  );
}
