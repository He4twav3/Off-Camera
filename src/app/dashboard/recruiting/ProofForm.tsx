"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
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
}: {
  assignmentId: string;
  currentProofUrl: string | null;
}) {
  const [state, formAction] = useActionState<ProofFormState, FormData>(
    submitProofAction,
    {},
  );

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <Field
        label="Link to your post"
        htmlFor={`proof-${assignmentId}`}
        hint="Paste the public URL of the post once it's live."
      >
        <Input
          id={`proof-${assignmentId}`}
          name="proof_url"
          type="url"
          defaultValue={currentProofUrl ?? ""}
          placeholder="https://www.tiktok.com/@you/video/..."
          required
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
