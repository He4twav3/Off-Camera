"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { agreeToContractAction, type ApplyState } from "@/app/dashboard/recruiting/jobs/[id]/actions";

function Go() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
      {pending ? "Saving…" : "I agree to the contract"}
    </button>
  );
}

/** The creator's agreement to the brand's contract: shown until they have agreed to its current version. */
export function AgreeContract({ assignmentId, changed }: { assignmentId: string; changed: boolean }) {
  const [state, action] = useActionState<ApplyState, FormData>(agreeToContractAction, {});
  if (state.success) return <p className="mb-3 text-sm font-semibold text-emerald-400">{state.success}</p>;
  return (
    <form action={action} className="mb-4 flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <p className="text-sm text-foreground">{changed ? "The brand changed the contract since you agreed. Read it, then agree to the new version." : "Read the contract below, then agree to it."}</p>
      <div className="flex items-center gap-3">
        <Go />
        {state.error && <span className="text-xs font-semibold text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
