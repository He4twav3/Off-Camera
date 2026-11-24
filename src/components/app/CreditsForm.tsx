"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveCreditsEmailAction, type CreditsState } from "@/app/dashboard/recruiting/jobs/[id]/credits-actions";

export function CreditsForm({ jobId, brand, saved }: { jobId: string; brand: string; saved: string | null }) {
  const [state, action, pending] = useActionState<CreditsState, FormData>(saveCreditsEmailAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="job" value={jobId} />
      <Field label={`Your ${brand} account email`} htmlFor={`credits-${jobId}`}>
        <Input
          id={`credits-${jobId}`}
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.value ?? saved ?? ""}
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
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : saved ? "Change email" : "Send for credits"}
        </Button>
      </div>
    </form>
  );
}
