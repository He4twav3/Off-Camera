"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  setApplicantStatusAction,
  assignApplicantAction,
  type AdminActionState,
} from "./actions";

function PendingButton({
  children,
  variant = "default",
  size = "sm",
}: {
  children: string;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "default";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}

export function StatusButtons({
  applicantId,
  status,
}: {
  applicantId: string;
  status: string;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    setApplicantStatusAction,
    {},
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && (
          <form action={formAction}>
            <input type="hidden" name="applicant_id" value={applicantId} />
            <input type="hidden" name="status" value="approved" />
            <PendingButton>Approve</PendingButton>
          </form>
        )}
        {status !== "rejected" && (
          <form action={formAction}>
            <input type="hidden" name="applicant_id" value={applicantId} />
            <input type="hidden" name="status" value="rejected" />
            <PendingButton variant="outline">Reject</PendingButton>
          </form>
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-toy-soft-foreground">
          {state.success}
        </p>
      )}
    </div>
  );
}

export function AssignForm({
  applicantId,
  openJobs,
}: {
  applicantId: string;
  openJobs: { id: string; title: string; payout_amount: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    assignApplicantAction,
    {},
  );

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Assign to a job
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-4 rounded-md bg-muted/50 p-5"
    >
      <input type="hidden" name="applicant_id" value={applicantId} />

      <Field label="Job" htmlFor={`job-${applicantId}`}>
        <Select id={`job-${applicantId}`} name="job_id" required>
          <option value="">Pick an open job</option>
          {openJobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Payout for this creator"
        htmlFor={`payout-${applicantId}`}
        hint="The flat amount they'll be quoted and paid. This is the only figure they ever see."
      >
        <Input
          id={`payout-${applicantId}`}
          name="applicant_payout_amount"
          type="number"
          min={0}
          step="0.01"
          placeholder="150"
          required
        />
      </Field>

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

      <div className="flex flex-wrap gap-3">
        <PendingButton size="default">Create assignment</PendingButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
