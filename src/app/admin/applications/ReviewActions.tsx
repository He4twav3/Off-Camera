"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  acceptApplicationAction,
  declineApplicationAction,
  type ReviewState,
} from "./actions";

function PendingButton({
  children,
  variant = "default",
}: {
  children: string;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}

export function ReviewActions({
  applicationId,
  suggestedPayout,
}: {
  applicationId: string;
  suggestedPayout: number;
}) {
  const [mode, setMode] = useState<"idle" | "accepting">("idle");
  const [acceptState, acceptAction] = useActionState<ReviewState, FormData>(
    acceptApplicationAction,
    {},
  );
  const [declineState, declineAction] = useActionState<ReviewState, FormData>(
    declineApplicationAction,
    {},
  );

  const done = acceptState.success || declineState.success;
  if (done) {
    return (
      <p
        role="status"
        className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground"
      >
        {acceptState.success ?? declineState.success}
      </p>
    );
  }

  const error = acceptState.error ?? declineState.error;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      {mode === "idle" ? (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setMode("accepting")}>
            Accept &amp; assign
          </Button>
          <form action={declineAction}>
            <input type="hidden" name="application_id" value={applicationId} />
            <PendingButton variant="outline">Decline</PendingButton>
          </form>
        </div>
      ) : (
        <form
          action={acceptAction}
          className="flex flex-col gap-4 rounded-md bg-muted/50 p-5"
        >
          <input type="hidden" name="application_id" value={applicationId} />

          <Field
            label="Payout for this creator"
            htmlFor={`payout-${applicationId}`}
            hint="The flat amount they'll be quoted and paid — the only figure they ever see. Pre-filled with the job's listed payout."
          >
            <Input
              id={`payout-${applicationId}`}
              name="applicant_payout_amount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={suggestedPayout}
              required
              autoFocus
            />
          </Field>

          <p className="text-sm text-muted-foreground">
            This accepts the application and puts them on the campaign in one
            go. They&apos;ll get an email with the amount.
          </p>

          <div className="flex flex-wrap gap-3">
            <PendingButton>Accept &amp; assign</PendingButton>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("idle")}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
