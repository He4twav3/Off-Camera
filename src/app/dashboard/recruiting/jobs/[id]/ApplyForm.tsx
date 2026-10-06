"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { applyToJobAction, type ApplyState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <Send size={20} />
      {pending ? "Sending…" : "Send application"}
    </Button>
  );
}

export function ApplyForm({
  jobId,
  sampleRequired = false,
  sampleCriteria = null,
}: {
  jobId: string;
  sampleRequired?: boolean;
  sampleCriteria?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ApplyState, FormData>(
    applyToJobAction,
    {},
  );

  if (state.success) {
    return (
      <div className="rounded-md bg-toy-soft/50 px-5 py-4">
        <p className="font-heading font-semibold text-toy-soft-foreground">
          Application sent
        </p>
        <p className="mt-1 text-[15px] text-toy-soft-foreground">
          We&apos;ll look at your profile and get back to you. You can track it
          from your{" "}
          <Link href="/dashboard/recruiting" className="font-semibold underline">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => setOpen(true)}>
          <Send size={20} />
          Apply with my profile
        </Button>
        <p className="text-sm text-muted-foreground">
          {sampleRequired
            ? "Your profile card plus a short sample video (a Google Drive link) gets sent as your application."
            : "Your profile card gets sent as your application — no CV needed."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="job_id" value={jobId} />

      {sampleRequired && (
        <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
          <p className="font-heading font-semibold text-foreground">
            This brand wants a sample video
          </p>
          {sampleCriteria && (
            <p className="mt-1 whitespace-pre-line text-[15px] text-muted-foreground">
              {sampleCriteria}
            </p>
          )}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Upload your video to Google Drive.</li>
            <li>
              Click Share and set access to <strong>Anyone with the link</strong>{" "}
              (viewer). If it is private, the brand can&apos;t watch it.
            </li>
            <li>Copy the link and paste it below.</li>
          </ol>
          <div className="mt-4">
            <Field label="Sample video link" htmlFor="sample_url">
              <Input
                id="sample_url"
                name="sample_url"
                type="url"
                inputMode="url"
                autoComplete="off"
                required
                maxLength={500}
                placeholder="https://drive.google.com/file/d/…"
              />
            </Field>
          </div>
        </div>
      )}

      <Field
        label="Anything you want to add?"
        htmlFor="cover_note"
        hint="Optional. A line or two on why this one suits you."
      >
        <Textarea
          id="cover_note"
          name="cover_note"
          maxLength={1000}
          placeholder="I've made a few videos in this space and my audience skews right for it…"
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
