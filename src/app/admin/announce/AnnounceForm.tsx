"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendMePersonaAnnouncementAction, type AnnounceState } from "./actions";

function Go({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending… keep this page open" : "Send announcement"}
    </button>
  );
}

/** Type SEND, press the button; afterwards it says how many went, and how many are left if any. */
export function AnnounceForm({ waiting }: { waiting: number }) {
  const [state, action] = useActionState<AnnounceState, FormData>(sendMePersonaAnnouncementAction, {});
  const [word, setWord] = useState("");
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.done && (
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <p className="font-semibold text-foreground">Sent to {state.done.sent}.</p>
          {state.done.failed > 0 && (
            <p className="mt-1 text-destructive">
              {state.done.failed} didn&apos;t go through. Press Send again later to retry just those.
            </p>
          )}
          {state.done.left > 0 && state.done.failed === 0 && (
            <p className="mt-1 text-muted-foreground">{state.done.left} still waiting. Press Send again to carry on.</p>
          )}
        </div>
      )}
      {state.error && <p className="text-sm font-semibold text-destructive">{state.error}</p>}
      <label className="text-sm text-muted-foreground">
        Type <strong className="text-foreground">SEND</strong> to confirm
        <input
          name="confirm"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          className="mt-1 block w-40 rounded-md border border-border bg-background px-3 py-2 text-foreground"
        />
      </label>
      <div>
        <Go disabled={word !== "SEND" || waiting === 0} />
      </div>
    </form>
  );
}
