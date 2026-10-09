"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { PostTerms } from "@/lib/post-terms";
import { RequirementsFields } from "@/components/RequirementsFields";
import { updatePayTermsAction, type PayTermsState } from "../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube" },
];

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
  const rows = Array.from({ length: 6 }, (_, i) => t.milestones[i] ?? null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold text-foreground">Requirements</h2>
        <RequirementsFields initial={t.requirements} />
      </section>
      <h2 className="font-heading text-base font-semibold text-foreground">Pay terms</h2>
      <input type="hidden" name="job_id" value={jobId} />
      {!terms && (
        <p className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This campaign has no per-video pay terms yet (it uses the older formula). Saving here switches it to per-video pay.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Pay per video ($)" htmlFor="base">
          <Input id="base" name="base" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={t.basePerPost} required />
        </Field>
        <Field label="Paid after every … videos" htmlFor="cycle">
          <Input id="cycle" name="cycle" type="number" inputMode="numeric" min={1} defaultValue={t.cycleSize} required />
        </Field>
        <Field label="Views count for … days" htmlFor="window">
          <Input id="window" name="window" type="number" inputMode="numeric" min={1} defaultValue={t.windowDays} required />
        </Field>
        <Field label="Keep public … days" htmlFor="keep_public">
          <Input id="keep_public" name="keep_public" type="number" inputMode="numeric" min={0} defaultValue={t.keepPublicDays} required />
        </Field>
      </div>

      <div>
        <p className="text-[15px] font-semibold text-foreground">View bonuses</p>
        <p className="text-sm text-muted-foreground">One bonus per post, at the highest milestone it reaches. They don&apos;t stack. Leave a row empty to skip it.</p>
        <div className="mt-2 grid max-w-md gap-2">
          {rows.map((m, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <Input name="ms_views" type="number" inputMode="numeric" min={1} defaultValue={m?.views ?? ""} placeholder="Views" aria-label={`Bonus ${i + 1}: views`} />
              <Input name="ms_amount" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={m?.amount ?? ""} placeholder="Bonus ($)" aria-label={`Bonus ${i + 1}: amount`} />
            </div>
          ))}
        </div>
      </div>

      <fieldset>
        <legend className="text-[15px] font-semibold text-foreground">Where creators post</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {PLATFORMS.map((p) => (
            <label key={p.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="platforms" value={p.value} defaultChecked={t.platforms.includes(p.value as never)} className="size-4" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input type="checkbox" name="reposts_earn_base" defaultChecked={t.repostsEarnBase} className="mt-0.5 size-4" />
        <span>
          Every post earns the base pay
          <span className="block text-xs text-muted-foreground">
            Off (the default): the base is paid once per unique video. A creator&apos;s first post sets their main platform, and the same video
            on other platforms is a repost that earns view bonuses only.
          </span>
        </span>
      </label>

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
