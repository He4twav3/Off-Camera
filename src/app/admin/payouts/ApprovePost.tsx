"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { approvePostAction, type ApproveState } from "./actions";

export function ApprovePost({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, pending] = useActionState<ApproveState, FormData>(approvePostAction, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Approving…" : "Approve post"}
      </Button>
      {state.error && <span role="alert" className="text-sm font-semibold text-destructive">{state.error}</span>}
      {state.success && <span role="status" className="text-sm font-semibold text-toy-soft-foreground">{state.success}</span>}
    </form>
  );
}
