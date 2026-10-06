"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MIN_WITHDRAWAL } from "@/lib/balance";
import { requestWithdrawalAction, type WithdrawState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Request withdrawal"}
    </Button>
  );
}

export function WithdrawForm({ available }: { available: number }) {
  const [state, formAction] = useActionState<WithdrawState, FormData>(requestWithdrawalAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Amount ($)"
        htmlFor="withdraw-amount"
        hint={`Up to ${available.toFixed(2)}. The smallest withdrawal is $${MIN_WITHDRAWAL}.`}
      >
        <Input
          id="withdraw-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min={MIN_WITHDRAWAL}
          max={available}
          step="0.01"
          defaultValue={available.toFixed(2)}
          required
        />
      </Field>

      <Field
        label="How should we pay you?"
        htmlFor="withdraw-details"
        hint="Your IBAN and the name on the account, or the email on your Wise or PayPal. Only you and our admins can see this."
      >
        <Textarea
          id="withdraw-details"
          name="details"
          maxLength={300}
          required
          placeholder="IBAN GR00 0000 0000 0000 0000 0000 000, account holder Maria K."
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
          {state.success}
        </p>
      )}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
