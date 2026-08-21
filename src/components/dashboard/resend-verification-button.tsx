"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, type ResendVerificationState } from "@/app/dashboard/actions";

const initialState: ResendVerificationState = {};

export function ResendVerificationButton() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initialState);

  if (state.sent) {
    return <p className="text-sm text-toy-soft-foreground/80">Sent — check your inbox.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
    </form>
  );
}
