"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { reportNotPaidAction, savePayoutInstructionsAction, type DirectState } from "./direct-actions";

function Submit({ children, pendingText }: { children: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

function Message({ state }: { state: DirectState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
        {state.success}
      </p>
    );
  }
  return null;
}

export function PayoutInstructionsForm({ current }: { current: string | null }) {
  const [state, formAction] = useActionState<DirectState, FormData>(savePayoutInstructionsAction, {});
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field
        label="How should brands pay you?"
        htmlFor="payout_instructions"
        hint="Your PayPal or Wise email, or your IBAN. Brands you work with will see this. Never enter a card number."
      >
        <Input
          id="payout_instructions"
          name="payout_instructions"
          defaultValue={current ?? ""}
          maxLength={200}
          placeholder="e.g. PayPal: you@example.com"
          autoComplete="off"
        />
      </Field>
      <Message state={state} />
      <div>
        <Submit pendingText="Saving…">Save</Submit>
      </div>
    </form>
  );
}

export function ReportNotPaid({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<DirectState, FormData>(reportNotPaidAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-9 cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
      >
        I haven&apos;t been paid
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Field label="What happened? (optional)" htmlFor={`note-${id}`} hint="We'll follow up with the brand.">
        <Textarea id={`note-${id}`} name="note" maxLength={500} />
      </Field>
      <Message state={state} />
      <div className="flex gap-3">
        <Submit pendingText="Sending…">Tell us I wasn&apos;t paid</Submit>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
