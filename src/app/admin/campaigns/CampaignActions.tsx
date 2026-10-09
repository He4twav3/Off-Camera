"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { reviewSignupAction, type CampaignAdminState } from "./actions";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteSignupAction } from "../delete-actions";

function Submit({
  children,
  variant = "default",
}: {
  children: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}

export function CampaignActions({ id, status, name = "this signup" }: { id: string; status: string; name?: string }) {
  const [state, formAction] = useActionState<CampaignAdminState, FormData>(
    reviewSignupAction,
    {},
  );

  const button = (intent: string, label: string, variant?: "default" | "outline" | "destructive") => (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <Submit variant={variant}>{label}</Submit>
    </form>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && button("approve", "Approve + count views")}
        {status === "approved" && button("refresh", "Refresh views", "outline")}
        {status !== "rejected" && button("reject", "Reject", "destructive")}
      </div>
      <ConfirmDelete action={deleteSignupAction} id={id} what={name} />
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-muted-foreground">{state.success}</p>}
    </div>
  );
}
