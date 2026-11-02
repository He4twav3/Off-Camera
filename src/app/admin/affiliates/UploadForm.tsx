"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { uploadCodesAction, type CodesState } from "./actions";

export function UploadForm({ program, hasCodes }: { program: string; hasCodes: boolean }) {
  const [state, action, pending] = useActionState<CodesState, FormData>(uploadCodesAction, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="program" value={program} />
      <Field label={hasCodes ? "Add more codes (CSV)" : "The brand's code list (CSV)"} htmlFor={`codes-${program}`}>
        <Input id={`codes-${program}`} name="codes" type="file" accept=".csv,text/csv" />
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
          {pending ? "Uploading…" : "Upload codes"}
        </Button>
      </div>
    </form>
  );
}
