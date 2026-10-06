"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { savePayoutAction, type PayoutActionState } from "./actions";
import { PLATFORM_COMMISSION_PERCENT } from "@/lib/commission";

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
  /** What the creator is owed for this assignment. */
  creatorPayout: number;
  existing: {
    gross_amount: number;
    notes: string | null;
    brand_paid_at: string | null;
    brand_payment_ref: string | null;
  } | null;
}

export function PayoutForm({
  assignmentId,
  alreadyPaid,
  creatorPayout,
  existing,
}: PayoutFormProps) {
  const [state, formAction] = useActionState<PayoutActionState, FormData>(
    savePayoutAction,
    {},
  );
  const [gross, setGross] = useState(existing?.gross_amount?.toString() ?? "");
  const [brandPaid, setBrandPaid] = useState(Boolean(existing?.brand_paid_at));

  // Your cut on this assignment: what the brand paid minus what the creator gets.
  const grossNum = Number(gross);
  const cut = grossNum > 0 ? grossNum - creatorPayout : null;
  const cutPct = cut !== null && grossNum > 0 ? (cut / grossNum) * 100 : null;

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            value={gross}
            onChange={(e) => setGross(e.target.value)}
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

      {cut !== null && (
        <p className="text-sm text-muted-foreground">
          Creator gets <strong className="text-foreground">${creatorPayout.toFixed(2)}</strong> · your cut{" "}
          <strong className="text-foreground">${cut.toFixed(2)}</strong>
          {cutPct !== null && ` (${cutPct.toFixed(1)}%)`}
          {PLATFORM_COMMISSION_PERCENT !== null && cutPct !== null && Math.abs(cutPct - PLATFORM_COMMISSION_PERCENT) > 0.5 &&
            ` — differs from the ${PLATFORM_COMMISSION_PERCENT}% commission you've published`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Checkbox
          id={`brand-paid-${assignmentId}`}
          name="brand_paid"
          checked={brandPaid}
          onChange={(e) => setBrandPaid(e.target.checked)}
          label="The brand's payment has arrived in our account."
        />
        <Field label="Payment reference" htmlFor={`ref-${assignmentId}`} hint="Invoice or transfer id (optional).">
          <Input
            id={`ref-${assignmentId}`}
            name="brand_payment_ref"
            defaultValue={existing?.brand_payment_ref ?? ""}
            placeholder="INV-0042 / bank ref"
          />
        </Field>
      </div>

      {!alreadyPaid && (
        <Checkbox
          id={`mark-paid-${assignmentId}`}
          name="mark_paid"
          disabled={!brandPaid}
          label={
            brandPaid
              ? "I've sent the creator their payout — mark this paid and email them."
              : "Mark the creator paid (available once the brand's payment has arrived)."
          }
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
