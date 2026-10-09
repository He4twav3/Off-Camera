"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { setApplicantStatusAction, type AdminActionState } from "./actions";

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
