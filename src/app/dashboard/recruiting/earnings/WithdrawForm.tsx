"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MIN_WITHDRAWAL } from "@/lib/balance";
import { removeDestinationAction, requestWithdrawalAction, type WithdrawState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : label}
    </Button>
  );
}

export function WithdrawForm({
  available,
  maxNow,
  saved,
}: {
  available: number;
  maxNow: number;
  /** The saved payout email, shown only as its first 4 characters. */
  saved: { hint: string; holder: string } | null;
}) {
  const [state, formAction] = useActionState<WithdrawState, FormData>(requestWithdrawalAction, {});
  const [changing, setChanging] = useState(false);
  const top = Math.min(available, maxNow);
  const showNew = !saved || changing;

  return (
    <div className="flex flex-col gap-5">
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

        {showNew ? (
          <>
            <Field
              label="Your name"
              htmlFor="withdraw-holder"
              hint="The name you'll get paid under. It should match the name on your profile, or we'll look more closely before paying."
            >
              <Input id="withdraw-holder" name="holder" autoComplete="name" maxLength={100} defaultValue={saved?.holder ?? ""} required />
            </Field>
            <Field
              label="Email for your payout"
              htmlFor="withdraw-email"
              hint="We send the money through Wise. Wise emails you a secure link to enter your bank details yourself, so we never see or store them. We'll remember this email for next time. A new email needs confirming by email and waits 72 hours."
            >
              <Input id="withdraw-email" name="email" type="email" autoComplete="email" maxLength={200} required placeholder="you@example.com" />
            </Field>
            {saved && (
              <button type="button" onClick={() => setChanging(false)} className="self-start text-sm font-semibold text-muted-foreground underline underline-offset-2">
                Keep using my saved email
              </button>
            )}
          </>
        ) : (
          <p className="rounded-md bg-muted/50 px-4 py-3 text-[15px] text-foreground">
            Paying to your saved email, starting <span className="font-mono font-semibold">{saved?.hint}…</span>{" "}
            ({saved?.holder}).
          </p>
        )}

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
          <SubmitButton label={showNew ? "Request withdrawal" : `Withdraw`} />
        </div>
      </form>

      {saved && !changing && (
        <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
          <button type="button" onClick={() => setChanging(true)} className="font-semibold text-primary underline underline-offset-2">
            Use a different email
          </button>
          <form action={removeDestinationAction}>
            <button type="submit" className="font-semibold text-muted-foreground underline underline-offset-2">
              Remove my saved email
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
