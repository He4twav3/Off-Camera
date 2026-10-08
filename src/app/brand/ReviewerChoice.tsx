"use client";

import { useActionState } from "react";
import { setPostReviewerAction, type BrandPayState } from "./actions";

/** A brand picks who checks each post on a per-post campaign: OnCamera (default) or the brand. */
export function ReviewerChoice({
  jobId,
  reviewer,
}: {
  jobId: string;
  reviewer: "oncamera" | "brand";
}) {
  const [state, action, pending] = useActionState<BrandPayState, FormData>(setPostReviewerAction, {});
  const current = state.success
    ? state.success.startsWith("You") ? "brand" : "oncamera"
    : reviewer;
  const option = (value: "oncamera" | "brand", title: string, body: string) => (
    <form action={action} className="flex-1">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="reviewer" value={value} />
      <button
        type="submit"
        disabled={pending}
        aria-current={current === value ? "true" : undefined}
        className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
          current === value ? "border-primary ring-1 ring-primary" : "border-border/70 hover:border-primary/40"
        }`}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">{current === value && <span aria-hidden className="size-2 rounded-full bg-primary" />}{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{body}</span>
      </button>
    </form>
  );
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Who reviews each post before it is paid?</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {option("oncamera", "OnCamera reviews", "We check every post for you. Nothing for you to do.")}
        {option("brand", "I review", "You approve or deny each post yourself.")}
      </div>
      {state.error && <p className="mt-2 text-xs font-semibold text-destructive">{state.error}</p>}
    </div>
  );
}
