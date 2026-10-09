"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { PostTerms } from "@/lib/post-terms";
import { RequirementsFields } from "@/components/RequirementsFields";
import { PayTermsFields } from "@/components/PayTermsFields";
import { updatePayTermsAction, type PayTermsState } from "../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

const DEFAULT: PostTerms = {
  v: 2,
  basePerPost: 20,
  cycleSize: 15,
  milestones: [],
  windowDays: 30,
  keepPublicDays: 90,
  platforms: ["tiktok", "instagram", "youtube_shorts"],
  repostsEarnBase: false,
  reviewer: "oncamera",
};

/** The contract's pay terms, editable. Six bonus rows; an empty row is skipped. */
export function PayTermsForm({ jobId, terms }: { jobId: string; terms: PostTerms | null }) {
  const [state, action] = useActionState<PayTermsState, FormData>(updatePayTermsAction, {});
  const t = terms ?? DEFAULT;
  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Requirements</h2>
        <RequirementsFields initial={t.requirements} platforms={t.platforms} />
      </section>
      <h2 className="font-heading text-base font-semibold text-foreground">Pay terms</h2>
      <input type="hidden" name="job_id" value={jobId} />
      {!terms && (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This campaign has no per-video pay terms yet (it uses the older formula). Saving here switches it to per-video pay.
        </p>
      )}
      <PayTermsFields terms={t} />

      <fieldset>
        <legend className="text-[15px] font-semibold text-foreground">Who reviews posts</legend>
        <div className="mt-2 flex flex-wrap gap-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="reviewer" value="oncamera" defaultChecked={t.reviewer === "oncamera"} />
            OnCamera
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="reviewer" value="brand" defaultChecked={t.reviewer === "brand"} />
            The brand
          </label>
        </div>
      </fieldset>

      <p className="text-sm text-muted-foreground">
        Changing these changes what is owed on videos already made, and the figures every creator and brand sees.
      </p>
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
