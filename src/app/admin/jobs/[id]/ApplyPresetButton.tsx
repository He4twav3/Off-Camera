"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { applyCampaignPresetAction, type ApplyPresetState } from "../actions";

function Apply({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Applying…" : `Apply the signed-off ${label} setup`}
    </Button>
  );
}

/** One step to put a signed-off setup (lib/campaign-presets.ts) on this campaign, replacing what is there. */
export function ApplyPresetButton({ jobId, presetKey, label }: { jobId: string; presetKey: string; label: string }) {
  const [state, action] = useActionState<ApplyPresetState, FormData>(applyCampaignPresetAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Replace this campaign's brief, brand note, example videos, guide, scripts and pay terms with the signed-off ${label} setup?`)) e.preventDefault();
      }}
      className="flex flex-col items-start gap-1.5"
    >
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="preset" value={presetKey} />
      <Apply label={label} />
      {state.error && <p role="alert" className="text-sm font-semibold text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
    </form>
  );
}
