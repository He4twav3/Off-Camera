"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { FeeTerms } from "@/lib/fee";
import { saveFeeAction, type PayTermsState } from "../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save fee"}
    </Button>
  );
}

type Row = { upTo: string; pct: string };

/** OnCamera's fee for this campaign: a percentage on top of creator pay, in bands. Admin only; never shown to brands or creators. */
export function FeeForm({ jobId, fee }: { jobId: string; fee: FeeTerms }) {
  const bands = fee.bands;
  const [state, action] = useActionState<PayTermsState, FormData>(saveFeeAction, {});
  const start: Row[] = bands.map((b) => ({ upTo: b.upTo === null ? "" : String(b.upTo), pct: String(b.percent) }));
  const [rows, setRows] = useState<Row[]>(start.length ? start : [{ upTo: "", pct: "" }]);
  const set = (i: number, k: keyof Row, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="job_id" value={jobId} />
      <div className="grid max-w-lg gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
              <Input name="fee_pct" type="number" inputMode="decimal" min={0} max={100} step="0.1" value={r.pct} onChange={(e) => set(i, "pct", e.target.value)} placeholder="% on top" aria-label={`Fee ${i + 1}: percent on top of creator pay`} />
              <Input name="fee_upto" type="number" inputMode="decimal" min={0} value={r.upTo} onChange={(e) => set(i, "upTo", e.target.value)} placeholder="Up to creator pay ($), blank = the rest" aria-label={`Fee ${i + 1}: applies up to this much creator pay`} />
            </div>
            {rows.length > 1 && (
              <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={`Remove fee ${i + 1}`} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {rows.length < 6 && (
        <button type="button" onClick={() => setRows((x) => [...x, { upTo: "", pct: "" }])} aria-label="Add another fee band" className="inline-flex size-9 w-fit cursor-pointer items-center justify-center rounded-md border border-border text-primary hover:bg-muted">
          <Plus className="size-4" />
        </button>
      )}
      <div className="max-w-lg">
        <label htmlFor="fee_min" className="text-sm font-medium text-foreground">
          Minimum per month ($), only in a month creators were paid
        </label>
        <Input id="fee_min" name="fee_min" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={fee.minimum || ""} className="mt-1" />
      </div>
      {state.error && <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
      <div>
        <Save />
      </div>
    </form>
  );
}
