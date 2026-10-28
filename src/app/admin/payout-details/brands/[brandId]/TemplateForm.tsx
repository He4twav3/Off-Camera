"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminUploadWiseTemplateAction, type TemplateState } from "./template-actions";

function Submit({ replace }: { replace: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
      {pending ? "Uploading…" : replace ? "Replace template" : "Upload template"}
    </button>
  );
}

/** Upload the blank Wise template a brand sent us (CSV), so its payment files use Wise's exact columns. */
export function TemplateForm({ brandId, hasTemplate }: { brandId: string; hasTemplate: boolean }) {
  const [state, action] = useActionState<TemplateState, FormData>(adminUploadWiseTemplateAction, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="file" name="template" accept=".csv,text/csv" className="text-sm" />
      <Submit replace={hasTemplate} />
      {state.error && <p role="alert" className="w-full text-sm font-semibold text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="w-full text-sm font-semibold text-foreground">{state.success}</p>}
    </form>
  );
}
