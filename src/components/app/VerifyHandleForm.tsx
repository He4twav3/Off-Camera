"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { verifyHandleAction, type VerifyHandleState } from "@/app/dashboard/recruiting/actions";

const initial: VerifyHandleState = {};

export function VerifyHandleForm({ handleId }: { handleId: string }) {
  const [state, formAction, pending] = useActionState(verifyHandleAction, initial);
  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="handle_id" value={handleId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Checking…" : "Check my bio"}
      </Button>
      {state.error && <p className="mt-2 text-sm font-medium text-destructive">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm text-muted-foreground">{state.success}</p>}
    </form>
  );
}
