"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { STATEMENT_DUE_DAYS } from "@/lib/direct-pay";
import { issueStatementAction, type StatementActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Issuing…" : "Issue statement"}
    </Button>
  );
}

export function IssueForm({
  assignmentId,
  suggestedAmount,
}: {
  assignmentId: string;
  suggestedAmount: number | null;
}) {
  const [state, formAction] = useActionState<StatementActionState, FormData>(issueStatementAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="Brand owes the creator ($)"
          htmlFor={`amount-${assignmentId}`}
          hint={suggestedAmount ? "Prefilled from the campaign's formula and the views so far. Change it if needed." : "No formula on this campaign, so enter the agreed amount."}
        >
          <Input
            id={`amount-${assignmentId}`}
            name="amount"
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={suggestedAmount ? suggestedAmount.toFixed(2) : ""}
            required
          />
        </Field>
        <Field label="Our fee ($)" htmlFor={`fee-${assignmentId}`} hint="Admin-only. What we invoice the brand separately. Never shown to creators or brands.">
          <Input id={`fee-${assignmentId}`} name="our_fee" type="number" min={0} step="0.01" defaultValue="0" />
        </Field>
        <Field label="Brand has (days)" htmlFor={`due-${assignmentId}`} hint="To pay the creator.">
          <Input id={`due-${assignmentId}`} name="due_days" type="number" min={1} max={90} step="1" defaultValue={STATEMENT_DUE_DAYS} />
        </Field>
      </div>

      {state.error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
          {state.success}
        </p>
      )}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
