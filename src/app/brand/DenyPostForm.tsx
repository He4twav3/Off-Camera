"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { approvePostAsBrandAction, denyPostAction, type BrandPayState } from "./actions";

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Denying…" : "Deny post"}
    </button>
  );
}

/** A brand's "Deny": opens a small box for an optional reason, then rejects that one post. */
export function DenyPostForm({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<BrandPayState, FormData>(denyPostAction, {});

  if (state.success) {
    return <p className="text-xs font-semibold text-muted-foreground">{state.success}</p>;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs font-semibold text-destructive underline underline-offset-2"
      >
        Deny
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="post_id" value={postId} />
      <input
        name="reason"
        maxLength={200}
        placeholder="Reason (optional)"
        aria-label="Reason for denying this post"
        className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
      />
      <Confirm />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer text-xs text-muted-foreground"
      >
        Cancel
      </button>
      {state.error && <p className="w-full text-xs font-semibold text-destructive">{state.error}</p>}
    </form>
  );
}

/** Approve button, for a brand that reviews its own posts. */
export function ApprovePostForm({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState<BrandPayState, FormData>(approvePostAsBrandAction, {});
  if (state.success) {
    return <span className="text-xs font-semibold text-emerald-400">Approved</span>;
  }
  return (
    <form action={action} className="inline">
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer text-xs font-semibold text-primary underline underline-offset-2"
      >
        {pending ? "Approving…" : "Approve"}
      </button>
      {state.error && <span className="ml-2 text-xs font-semibold text-destructive">{state.error}</span>}
    </form>
  );
}
