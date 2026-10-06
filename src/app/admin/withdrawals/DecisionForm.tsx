"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { decideWithdrawalAction, type DecisionState } from "./actions";

export function DecisionForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<DecisionState, FormData>(decideWithdrawalAction, {});
  const [mode, setMode] = useState<"paid" | "rejected">("paid");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={mode} />

      <div className="flex gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setMode("paid")}
          className={mode === "paid" ? "rounded-full bg-primary px-3 py-1.5 text-primary-foreground" : "rounded-full border border-border px-3 py-1.5 text-muted-foreground"}
        >
          Mark paid
        </button>
        <button
          type="button"
          onClick={() => setMode("rejected")}
          className={mode === "rejected" ? "rounded-full bg-destructive px-3 py-1.5 text-white" : "rounded-full border border-border px-3 py-1.5 text-muted-foreground"}
        >
          Reject
        </button>
      </div>

      {mode === "paid" ? (
        <Input name="ref" maxLength={200} placeholder="Transfer reference (e.g. the Wise transfer ID), optional" aria-label="Transfer reference" />
      ) : (
        <Input name="note" maxLength={500} placeholder="Reason, shown to the creator" aria-label="Reason" required />
      )}

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-toy-soft-foreground">{state.success}</p>
      )}

      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : mode === "paid" ? "Confirm: I've sent the money" : "Confirm rejection"}
        </Button>
      </div>
    </form>
  );
}
