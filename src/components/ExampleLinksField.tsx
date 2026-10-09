"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_EXAMPLES } from "@/lib/campaign-brief";

/**
 * Example links as an organised list: one link per row, an X to remove it, and "Add another" up to the limit.
 * It submits the same hidden `examples` field the forms already send (one link per line), so nothing else changes.
 */
export function ExampleLinksField({ initial = "" }: { initial?: string }) {
  const start = initial.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [rows, setRows] = useState<string[]>(start.length ? start : [""]);
  const set = (i: number, v: string) => setRows((r) => r.map((x, j) => (j === i ? v : x)));

  return (
    <div>
      <input type="hidden" name="examples" value={rows.map((r) => r.trim()).filter(Boolean).join("\n")} />
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
            <input
              type="url"
              value={r}
              onChange={(e) => set(i, e.target.value)}
              placeholder="https://www.tiktok.com/@brand/video/…  or any link"
              aria-label={`Example link ${i + 1}`}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setRows((x) => (x.length === 1 ? [""] : x.filter((_, j) => j !== i)))}
              aria-label={`Remove link ${i + 1}`}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {rows.length < MAX_EXAMPLES && (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, ""])}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Plus className="size-4" />
          Add another link
        </button>
      )}
    </div>
  );
}
