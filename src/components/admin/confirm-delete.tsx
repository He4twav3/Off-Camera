"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

type State = { error?: string; success?: string };

function Yes() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Yes, delete"}
    </button>
  );
}

/** Delete with a second step, so a stray click can't remove anything. `what` names it in the question. */
export function ConfirmDelete({
  action,
  id,
  what,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  id: string;
  what: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<State, FormData>(action, {});
  if (state.success) return <span className="text-xs font-semibold text-muted-foreground">Deleted</span>;
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs font-semibold text-destructive hover:underline"
      >
        Delete
      </button>
    );
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-foreground">Delete {what} for good?</span>
      <Yes />
      <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-xs text-muted-foreground">
        Cancel
      </button>
      {state.error && <span className="w-full text-xs font-semibold text-destructive">{state.error}</span>}
    </form>
  );
}
