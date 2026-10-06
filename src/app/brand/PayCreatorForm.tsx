"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { BRAND_METHODS } from "@/lib/direct-pay";
import { markBrandPaidAction, type BrandPayState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Mark as paid"}
    </Button>
  );
}

export function PayCreatorForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<BrandPayState, FormData>(markBrandPaidAction, {});
  if (state.success) {
    return (
      <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
        {state.success}
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      <Field label="How did you pay?" htmlFor={`method-${id}`}>
        <Select id={`method-${id}`} name="method" defaultValue={BRAND_METHODS[0]}>
          {BRAND_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Reference (optional)" htmlFor={`ref-${id}`}>
        <Input id={`ref-${id}`} name="reference" maxLength={200} placeholder="Transfer ID or note" />
      </Field>
      <Submit />
      {state.error && (
        <p role="alert" className="w-full text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
