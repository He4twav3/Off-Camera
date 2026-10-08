"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Clock, Plus, X, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
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
export function SubmitPost({
  assignmentId,
  originals = [],
}: {
  assignmentId: string;
  /** Videos already added, so a new link can be marked as a repost of one of them. */
  originals?: { id: string; label: string }[];
}) {
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
          {originals.length > 0 && (
            <Field
              label="Is this the same video as one you already added?"
              htmlFor={`repost-${assignmentId}`}
              hint="Pay is per unique video. The same video on another platform is a repost: it can still earn view bonuses, but not the base pay again."
            >
              <Select id={`repost-${assignmentId}`} name="repost_of" defaultValue="">
                <option value="">No, it&apos;s a new video</option>
                {originals.map((o) => (
                  <option key={o.id} value={o.id}>
                    Yes, a repost of {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {state.error && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
            >
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Post not added</p>
                <p className="mt-0.5 text-sm text-foreground">{state.error}</p>
              </div>
            </div>
          )}
          {state.success && (
            <div
              role="status"
              className="flex gap-3 rounded-lg border border-border bg-muted px-4 py-3"
            >
              {state.success.startsWith("Post added") ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
              ) : (
                <Clock className="mt-0.5 size-5 shrink-0 text-amber-400" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {state.success.startsWith("Post added")
                    ? "Post added: counting views"
                    : "Reviewing your post"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {state.success}
                </p>
                <Link
                  href={`/dashboard/recruiting/earnings/${assignmentId}?tab=posts`}
                  className="mt-1.5 inline-block text-sm font-semibold text-primary underline underline-offset-2"
                >
                  See your posts
                </Link>
              </div>
            </div>
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
