"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { savePayoutAction, type PayoutActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

interface PayoutFormProps {
  assignmentId: string;
  alreadyPaid: boolean;
  existing: {
    gross_amount: number;
    notes: string | null;
  } | null;
}

export function PayoutForm({
  assignmentId,
  alreadyPaid,
  existing,
}: PayoutFormProps) {
  const [state, formAction] = useActionState<PayoutActionState, FormData>(
    savePayoutAction,
    {},
  );

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Gross amount received"
          htmlFor={`gross-${assignmentId}`}
          hint="Admin-only, for your records. Never shown to the creator."
        >
          <Input
            id={`gross-${assignmentId}`}
            name="gross_amount"
            type="number"
            min={0}
            step="0.01"
            defaultValue={existing?.gross_amount ?? ""}
            placeholder="0.00"
            required
          />
        </Field>

        <Field label="Notes" htmlFor={`notes-${assignmentId}`}>
          <Textarea
            id={`notes-${assignmentId}`}
            name="notes"
            defaultValue={existing?.notes ?? ""}
            placeholder="Invoice ref, payment method, anything worth remembering."
            className="min-h-11"
          />
        </Field>
      </div>

      {!alreadyPaid && (
        <Checkbox
          id={`mark-paid-${assignmentId}`}
          name="mark_paid"
          label="I've sent the creator their payout — mark this paid and email them."
        />
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground"
        >
          {state.success}
        </p>
      )}

      <div className="self-start">
        <SubmitButton />
      </div>
    </form>
  );
}
