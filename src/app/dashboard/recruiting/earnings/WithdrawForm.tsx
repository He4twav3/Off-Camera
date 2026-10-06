"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
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

export function WithdrawForm({ available, maxNow }: { available: number; maxNow: number }) {
  const [state, formAction] = useActionState<WithdrawState, FormData>(requestWithdrawalAction, {});
  const top = Math.min(available, maxNow);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        label="Amount ($)"
        htmlFor="withdraw-amount"
        hint={`Up to ${top.toFixed(2)} right now. The smallest withdrawal is $${MIN_WITHDRAWAL}.`}
      >
        <Input
          id="withdraw-amount"
          name="amount"
          type="number"
          inputMode="decimal"
          min={MIN_WITHDRAWAL}
          max={top}
          step="0.01"
          defaultValue={top.toFixed(2)}
          required
        />
      </Field>

      <Field
        label="Your name"
        htmlFor="withdraw-holder"
        hint="The name you'll get paid under. It should match the name on your profile, or we'll look more closely before paying."
      >
        <Input id="withdraw-holder" name="holder" autoComplete="name" maxLength={100} required />
      </Field>

      <Field
        label="Email for your payout"
        htmlFor="withdraw-email"
        hint="We send the money through Wise. Wise emails you a secure link to enter your bank details yourself, so we never see or store your bank details. Please claim it within 7 days."
      >
        <Input
          id="withdraw-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={200}
          required
          placeholder="you@example.com"
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
