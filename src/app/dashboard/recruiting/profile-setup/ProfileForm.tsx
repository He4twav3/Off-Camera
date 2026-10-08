"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Section } from "@/components/account/AccountShell";
import { PictureField } from "@/components/account/PictureField";
import { saveProfileAction, type ProfileFormState } from "./actions";
import type { Applicant } from "@/lib/database.types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/** A stored full name back into first name and surname. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

/**
 * "Personal Information": the picture, then the details brands look at. Accounts are
 * connected on their own page, straight after the first save.
 */
export function ProfileForm({
  existing,
  defaultName,
}: {
  existing: Applicant | null;
  defaultName: string;
}) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    saveProfileAction,
    {},
  );
  const { first, last } = splitName(existing?.name ?? defaultName);

  return (
    <Section
      title="Personal Information"
      summary="Update your name, username, and profile picture."
    >
      <PictureField
        name={existing?.name ?? defaultName}
        url={existing?.avatar_url ?? null}
        canUpload={Boolean(existing)}
      />

      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="first_name"
            required
            hint="Your name as it will appear on your profile."
          >
            <Input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              defaultValue={first}
              placeholder="Alex"
              required
            />
          </Field>
          <Field label="Surname" htmlFor="last_name" required>
            <Input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              defaultValue={last}
              placeholder="Rivera"
              required
            />
          </Field>
        </div>

        <Field
          label="Username"
          htmlFor="username"
          required
          hint="Your unique username. Can only contain lowercase letters, numbers, and underscores."
        >
          <Input
            id="username"
            name="username"
            defaultValue={existing?.username ?? ""}
            placeholder="alexrivera"
            pattern="[a-z0-9_]{3,30}"
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
          <p className="text-sm font-semibold text-toy-soft-foreground">
            {state.success}
          </p>
        )}

        <SubmitButton label={existing ? "Save Changes" : "Save and continue"} />
      </form>
    </Section>
  );
}
