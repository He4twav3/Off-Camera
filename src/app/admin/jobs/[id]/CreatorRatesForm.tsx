"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { saveCreatorRatesAction, type PayTermsState } from "../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save pay"}
    </Button>
  );
}

/**
 * Pay agreed with each creator: when on, the campaign shows no pay, and each creator
 * is paid the flat amount per unique video set here. Admin only.
 */
export function CreatorRatesForm({
  jobId,
  agreed,
  creators,
}: {
  jobId: string;
  agreed: boolean;
  creators: { assignmentId: string; name: string; rate: number | null }[];
}) {
  const [state, action] = useActionState<PayTermsState, FormData>(saveCreatorRatesAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="job_id" value={jobId} />
      <label className="flex items-start gap-3 text-sm text-foreground">
        <input type="checkbox" name="agreed" defaultChecked={agreed} className="mt-0.5 size-4 accent-primary" />
        <span>
          <span className="font-medium">Pay agreed with each creator</span>
          <span className="block text-muted-foreground">
            Creators see no pay on the campaign. Once they&rsquo;re on it, each one sees and is paid their own rate per unique video, with no view pay. A creator without a rate earns nothing and sees no pay until you set one.
          </span>
        </span>
      </label>
      {creators.length > 0 && (
        <div className="grid max-w-lg gap-2">
          {creators.map((c) => (
            <div key={c.assignmentId} className="flex items-center gap-3">
              <label htmlFor={`rate_${c.assignmentId}`} className="min-w-0 flex-1 truncate text-sm text-foreground">
                {c.name}
              </label>
              <Input
                id={`rate_${c.assignmentId}`}
                name={`rate_${c.assignmentId}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                defaultValue={c.rate ?? ""}
                placeholder="$ per video"
                className="w-36"
              />
            </div>
          ))}
        </div>
      )}
      {state.error && <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
      <div>
        <Save />
      </div>
    </form>
  );
}
