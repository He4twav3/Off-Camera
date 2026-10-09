"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { STATEMENT_DUE_DAYS } from "@/lib/direct-pay";
import { feeForStatement, type FeeTerms } from "@/lib/fee";
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
  fee: feeSetting,
}: {
  assignmentId: string;
  suggestedAmount: number | null;
  fee?: { terms: FeeTerms; lifetimeBilled: number; monthBilled: number; monthFees: number };
}) {
  const hasFee = Boolean(feeSetting && (feeSetting.terms.bands.length > 0 || feeSetting.terms.minimum > 0));
  const [state, formAction] = useActionState<StatementActionState, FormData>(issueStatementAction, {});
  // The fee follows the amount, from this campaign's fee, until it is typed over by hand.
  const [amount, setAmount] = useState(suggestedAmount ? suggestedAmount.toFixed(2) : "");
  const [feeTyped, setFeeTyped] = useState<string | null>(null);
  const auto = feeSetting ? feeForStatement({ ...feeSetting, amount: Number(amount) || 0 }) : 0;
  const fee = feeTyped ?? (hasFee ? auto.toFixed(2) : "0");

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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Our fee ($)" htmlFor={`fee-${assignmentId}`} hint={hasFee ? "Filled in from this campaign's fee. Admin-only: what we invoice the brand separately." : "No fee set for this campaign. Admin-only: what we invoice the brand separately."}>
          <Input id={`fee-${assignmentId}`} name="our_fee" type="number" min={0} step="0.01" value={fee} onChange={(e) => setFeeTyped(e.target.value)} />
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
