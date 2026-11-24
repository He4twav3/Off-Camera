"use client";

import { useActionState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveCreditsEmailAction, type CreditsState } from "@/app/dashboard/recruiting/jobs/[id]/credits-actions";

/**
 * The email the creator signs up to the brand with. `continue` saves it and sends them on to the brand's sign-up
 * page; `change` only saves a new one.
 */
export function CreditsForm({
  jobId,
  brand,
  initial,
  mode,
}: {
  jobId: string;
  brand: string;
  initial: string;
  mode: "continue" | "change";
}) {
  const [state, action, pending] = useActionState<CreditsState, FormData>(saveCreditsEmailAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="job" value={jobId} />
      {mode === "continue" && <input type="hidden" name="go" value="1" />}
      <Field label={mode === "continue" ? `The email you'll sign up to ${brand} with` : `Your ${brand} account email`} htmlFor={`credits-${jobId}`}>
        <Input
          id={`credits-${jobId}`}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.value ?? initial}
          placeholder="you@example.com"
          maxLength={254}
        />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-foreground">
          {state.success}
        </p>
      )}
      <div>
        {mode === "continue" ? (
          <Button type="submit" disabled={pending}>
            {pending ? "One moment…" : `Continue to ${brand}`}
            {!pending && <ExternalLink className="size-4" />}
          </Button>
        ) : (
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "Saving…" : "Change email"}
          </Button>
        )}
      </div>
    </form>
  );
}
