"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_PROVIDERS, providerOfLink, type PaymentProvider } from "@/lib/payment-links";
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
  const currentProvider = providerOfLink(current);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[15px] font-semibold text-foreground">1. Choose how you want to be paid</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Brands pay you straight into your own account. The payment provider takes its fee from what you receive.
          Pick one, create a free account if you don&apos;t have one, and make a payment link.
        </p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(PAYMENT_PROVIDERS) as PaymentProvider[]).map((key) => {
            const p = PAYMENT_PROVIDERS[key];
            return (
              <li key={key} className="flex flex-col rounded-lg border border-border/70 p-4">
                <p className="font-heading font-semibold text-foreground">{p.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
                <p className="mt-2 text-xs text-muted-foreground">{p.howTo}</p>
                <a
                  href={p.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Create a {p.label} account
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <Field
          label="2. Paste your payment link"
          htmlFor="payout_instructions"
          hint="Only Stripe, PayPal and Wise links. Brands you work with see this and pay you through it. Never enter a card number."
        >
          <Input
            id="payout_instructions"
            name="payout_instructions"
            type="url"
            inputMode="url"
            defaultValue={currentProvider ? (current ?? "") : ""}
            maxLength={300}
            placeholder="https://buy.stripe.com/…"
            autoComplete="off"
          />
        </Field>
        {current && !currentProvider && (
          <p className="text-sm text-muted-foreground">
            You currently have &ldquo;{current}&rdquo; saved. That is the older format. Replace it with a payment link.
          </p>
        )}
        {currentProvider && (
          <p className="text-sm text-muted-foreground">Saved: a {PAYMENT_PROVIDERS[currentProvider].label} link.</p>
        )}
        <Message state={state} />
        <div>
          <Submit pendingText="Saving…">Save</Submit>
        </div>
      </form>
    </div>
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
