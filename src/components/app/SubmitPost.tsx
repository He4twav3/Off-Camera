"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  submitPostAction,
  type ApplyState,
} from "@/app/dashboard/recruiting/jobs/[id]/actions";

function Send() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Checking…" : "Add post"}
    </Button>
  );
}

/** "Add a post": a button that opens a small window to paste the link to a new video. */
export function SubmitPost({ assignmentId }: { assignmentId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ApplyState, FormData>(
    async (prev, formData) => {
      const result = await submitPostAction(prev, formData);
      if (result.success) formRef.current?.reset();
      return result;
    },
    {},
  );

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        onClick={() => ref.current?.showModal()}
      >
        <Plus size={18} />
        Add a post
      </Button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-full max-w-md rounded-xl border border-border bg-card p-0 text-foreground backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">Add a post</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <form
          ref={formRef}
          action={action}
          className="flex flex-col gap-4 px-5 pt-4 pb-5"
        >
          <input type="hidden" name="assignment_id" value={assignmentId} />
          <Field
            label="Link to your post"
            htmlFor={`post-${assignmentId}`}
            hint="The full link, from your TikTok, Instagram or YouTube account. It has to be on one of your verified accounts, and have gone live after you connected that account and joined this campaign."
          >
            <Input
              id={`post-${assignmentId}`}
              name="post_url"
              type="url"
              required
              placeholder="https://www.tiktok.com/@you/video/1234567890"
            />
          </Field>
          {state.error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
            >
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
              {state.success}
            </p>
          )}
          <div className="flex gap-2">
            <Send />
            <Button
              type="button"
              variant="outline"
              onClick={() => ref.current?.close()}
            >
              Close
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
