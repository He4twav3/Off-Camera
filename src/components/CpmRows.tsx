"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/field";

type Row = { from: string; rate: string };
const MAX_ROWS = 6;

/** The CPM: one row to start, a plus button to add another band (a CPM and the views it starts at). Blank rows are skipped. */
export function CpmRows({ rows }: { rows: ({ from: number; rate: number } | null)[] }) {
  const start: Row[] = rows.filter((r): r is { from: number; rate: number } => r !== null).map((r) => ({ from: String(r.from), rate: String(r.rate) }));
  const [list, setList] = useState<Row[]>(start.length ? start : [{ from: "", rate: "" }]);
  const set = (i: number, k: keyof Row, v: string) => setList((l) => l.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

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
    </div>
  );
}
