"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { POST_LINK_EXAMPLES, PLATFORM_NAMES, type PostPlatform } from "@/lib/post-link";
import { submitProofAction, type ProofFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Upload size={20} />
      {pending ? "Submitting…" : "Submit my post"}
    </Button>
  );
}

export function ProofForm({
  assignmentId,
  currentProofUrl,
  platform,
}: {
  assignmentId: string;
  currentProofUrl: string | null;
  platform: PostPlatform;
}) {
  const [state, formAction] = useActionState<ProofFormState, FormData>(
    submitProofAction,
    {},
  );
  const inputId = useId();

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <Field
        label="Link to your post"
        htmlFor={inputId}
        hint={`This campaign is for ${PLATFORM_NAMES[platform]}. Paste the public link to your ${PLATFORM_NAMES[platform]} post once it's live.`}
      >
        <Input
          id={inputId}
          name="proof_url"
          type="url"
          defaultValue={currentProofUrl ?? ""}
          placeholder={POST_LINK_EXAMPLES[platform]}
          required
        />
      </Field>

      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="disclosed" required className="mt-0.5 size-4 shrink-0" />
        <span>
          I confirm this post is labelled as a paid partnership (the platform&apos;s label or #ad).
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground"
        >
          {state.success}
        </p>
      )}

      <div className="self-start">
        <SubmitButton />
      </div>
    </form>
  );
}
