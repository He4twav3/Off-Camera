"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { saveAffiliateLinkAction, type LinkState } from "./actions";

export function LinkForm({ program, saved, example }: { program: string; saved: string | null; example: string }) {
  const [state, action, pending] = useActionState<LinkState, FormData>(saveAffiliateLinkAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="program" value={program} />
      <Field label="Your link" htmlFor={`link-${program}`}>
        <Input id={`link-${program}`} name="link" defaultValue={state.value ?? saved ?? ""} placeholder={example} inputMode="url" maxLength={200} />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-foreground">
          {state.success}
        </p>
      )}
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : saved ? "Update link" : "Save link"}
        </Button>
      </div>
    </form>
  );
}
