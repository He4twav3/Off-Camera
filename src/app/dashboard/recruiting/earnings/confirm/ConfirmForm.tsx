"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { confirmWithdrawalAction, type WithdrawState } from "../actions";

// Confirming is a button press, not just opening the link, so email scanners
// that pre-open links can't confirm a request on the creator's behalf.
export function ConfirmForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<WithdrawState, FormData>(confirmWithdrawalAction, {});

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
          {state.success}
        </p>
        <Link href="/dashboard/recruiting/earnings" className="font-semibold text-primary underline underline-offset-2">
          Back to your earnings
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Confirming…" : "Yes, confirm this withdrawal"}
        </Button>
      </div>
    </form>
  );
}
