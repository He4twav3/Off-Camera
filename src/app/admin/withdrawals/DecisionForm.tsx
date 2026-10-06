"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { decideWithdrawalAction, type DecisionState } from "./actions";

type Mode = "approve" | "paid" | "rejected";

/**
 * What this admin can do with one request. The database enforces every rule
 * (hold, two-admin rule, freezes); this only hides buttons that would fail.
 */
export function DecisionForm({
  id,
  status,
  needsSecond,
  approvedBy,
  me,
  holdUntil,
  frozen,
}: {
  id: string;
  status: "pending_confirmation" | "requested";
  needsSecond: boolean;
  approvedBy: string | null;
  me: string;
  holdUntil: string | null;
  frozen: boolean;
}) {
  const [state, formAction, pending] = useActionState<DecisionState, FormData>(decideWithdrawalAction, {});

  const onHold = holdUntil !== null && new Date(holdUntil) > new Date();
  const modes: Mode[] = [];
  let note = "";
  if (status === "requested") {
    if (needsSecond && !approvedBy) modes.push("approve");
    else if (needsSecond && approvedBy === me) note = "You approved this one. A different admin has to mark it paid.";
    else if (frozen) note = "This creator's withdrawals are frozen. Unfreeze them to pay.";
    else if (onHold) note = `On hold until ${new Date(holdUntil!).toUTCString().replace(" GMT", " UTC")}.`;
    else modes.push("paid");
  } else {
    note = "Waiting for the creator to confirm by email.";
  }
  modes.push("rejected");

  const [mode, setMode] = useState<Mode>(modes[0]);
  const active = modes.includes(mode) ? mode : modes[0];
  const label: Record<Mode, string> = { approve: "Approve", paid: "Mark paid", rejected: "Reject" };

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={active} />

      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      <div className="flex gap-2 text-sm font-semibold">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              active === m
                ? m === "rejected"
                  ? "rounded-full bg-destructive px-3 py-1.5 text-white"
                  : "rounded-full bg-primary px-3 py-1.5 text-primary-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-muted-foreground"
            }
          >
            {label[m]}
          </button>
        ))}
      </div>

      {active === "paid" && (
        <Input name="ref" maxLength={200} placeholder="Transfer reference (e.g. the Wise transfer ID), optional" aria-label="Transfer reference" />
      )}
      {active === "rejected" && (
        <Input name="note" maxLength={500} placeholder="Reason, shown to the creator" aria-label="Reason" required />
      )}

      {state.error && <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="text-sm font-semibold text-toy-soft-foreground">{state.success}</p>}

      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending
            ? "Saving…"
            : active === "paid"
              ? "Confirm: I've sent the money"
              : active === "approve"
                ? "Confirm approval"
                : "Confirm rejection"}
        </Button>
      </div>
    </form>
  );
}
