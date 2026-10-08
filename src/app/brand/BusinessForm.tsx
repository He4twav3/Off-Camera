"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveBusinessDetailsAction, type BusinessState } from "./actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

/** A brand's business details: company name, who to contact, and website. */
export function BusinessForm({
  company,
  contact,
  website,
}: {
  company: string;
  contact: string;
  website: string | null;
}) {
  const [state, action] = useActionState<BusinessState, FormData>(saveBusinessDetailsAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Company name" htmlFor="company_name" hint="Shown to creators on your campaigns once they have joined.">
        <Input id="company_name" name="company_name" required maxLength={120} defaultValue={company} />
      </Field>
      <Field label="Contact name" htmlFor="contact_name" hint="Who we speak to about your account.">
        <Input id="contact_name" name="contact_name" required maxLength={120} defaultValue={contact} />
      </Field>
      <Field label="Website" htmlFor="website" hint="Optional.">
        <Input id="website" name="website" type="text" inputMode="url" maxLength={200} defaultValue={website ?? ""} placeholder="https://yourbrand.com" />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
      <div>
        <Save />
      </div>
    </form>
  );
}
