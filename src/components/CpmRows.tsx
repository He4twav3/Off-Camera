"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/field";

type Row = { from: string; rate: string };
const MAX_ROWS = 6;

/** The CPM: one row to start, a plus button to add another band (a CPM and the views it starts at). Blank rows are skipped. */
type Extra = number | string | undefined;
export function CpmRows({ rows, cap, minViews, maxPerVideo, rewards }: { rows: ({ from: number; rate: number } | null)[]; cap?: Extra; minViews?: Extra; maxPerVideo?: Extra; rewards?: { views: string; amount: string }[] }) {
  const start: Row[] = rows.filter((r): r is { from: number; rate: number } => r !== null).map((r) => ({ from: String(r.from), rate: String(r.rate) }));
  const [list, setList] = useState<Row[]>(start.length ? start : [{ from: "", rate: "" }]);
  const set = (i: number, k: keyof Row, v: string) => setList((l) => l.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const [prizes, setPrizes] = useState<{ views: string; amount: string }[]>(rewards?.length ? rewards : [{ views: "", amount: "" }]);
  const setPrize = (i: number, k: "views" | "amount", v: string) => setPrizes((l) => l.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div>
      <p className="text-[15px] font-semibold text-foreground">CPM</p>
      <div className="mt-2 grid max-w-md gap-2">
        {list.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
              <Input name="cpm_rate" type="number" inputMode="decimal" min={0} step="0.01" value={r.rate} onChange={(e) => set(i, "rate", e.target.value)} placeholder="CPM ($)" aria-label={`CPM ${i + 1}: dollars per 1,000 views`} />
              <Input name="cpm_from" type="number" inputMode="numeric" min={0} value={r.from} onChange={(e) => set(i, "from", e.target.value)} placeholder="From views" aria-label={`CPM ${i + 1}: starts at this many views`} />
            </div>
            {list.length > 1 && (
              <button
                type="button"
                onClick={() => setList((l) => l.filter((_, j) => j !== i))}
                aria-label={`Remove CPM ${i + 1}`}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {list.length < MAX_ROWS && (
        <button
          type="button"
          onClick={() => setList((l) => [...l, { from: "", rate: "" }])}
          aria-label="Add another CPM"
          className="mt-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-primary hover:bg-muted"
        >
          <Plus className="size-4" />
        </button>
      )}
      <div className="mt-3 grid max-w-md gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cpm_cap" className="text-sm font-medium text-foreground">
            CPM counts up to … views (optional)
          </label>
          <Input id="cpm_cap" name="cpm_cap" type="number" inputMode="numeric" min={1} defaultValue={cap ?? ""} placeholder="Views" className="mt-1" />
        </div>
        <div>
          <label htmlFor="min_views" className="text-sm font-medium text-foreground">
            Min views to earn (optional)
          </label>
          <Input id="min_views" name="min_views" type="number" inputMode="numeric" min={1} defaultValue={minViews ?? ""} placeholder="Views" className="mt-1" />
        </div>
        <div>
          <label htmlFor="max_per_video" className="text-sm font-medium text-foreground">
            Max view pay on a video ($, optional)
          </label>
          <Input id="max_per_video" name="max_per_video" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={maxPerVideo ?? ""} placeholder="$" className="mt-1" />
        </div>
      </div>
      <div className="mt-4 max-w-md">
        <p className="text-sm font-medium text-foreground">Rewards on top (optional)</p>
        <p className="text-xs text-muted-foreground">A one-off amount when a video reaches a number of views. A video earns only the highest one it reaches.</p>
        <div className="mt-2 grid gap-2">
          {prizes.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
                <Input name="reward_views" type="number" inputMode="numeric" min={1} value={r.views} onChange={(e) => setPrize(i, "views", e.target.value)} placeholder="At views" aria-label={`Reward ${i + 1}: views to reach`} />
                <Input name="reward_amount" type="number" inputMode="decimal" min={0} step="0.01" value={r.amount} onChange={(e) => setPrize(i, "amount", e.target.value)} placeholder="Reward ($)" aria-label={`Reward ${i + 1}: amount in dollars`} />
              </div>
              {prizes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPrizes((l) => l.filter((_, j) => j !== i))}
                  aria-label={`Remove reward ${i + 1}`}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {prizes.length < MAX_ROWS && (
          <button
            type="button"
            onClick={() => setPrizes((l) => [...l, { views: "", amount: "" }])}
            aria-label="Add another reward"
            className="mt-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border text-primary hover:bg-muted"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
