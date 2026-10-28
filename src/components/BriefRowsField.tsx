"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { parseBrief, type BriefList } from "@/lib/campaign-guide";

const HOOKS_TITLE = "Hooks you can use";

/**
 * The brief on the campaign page as rows: numbered points (a title and a line under it), then the hooks, one per
 * row, each with an X and "Add another" like the example links. It submits the same text the page reads ("## " for
 * a point, "### Hooks you can use" and "- " for the hooks), so nothing else changes. Any other "### " list already
 * in the brief is kept as it is. An older brief written as plain lines opens as one point per line.
 */
export function BriefRowsField({ name, initial }: { name: string; initial: string }) {
  const parsed = parseBrief(initial);
  const plainLines = parsed.steps.length === 0 && parsed.lists.length === 0;
  const startSteps = plainLines
    ? initial
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\s•\-*•]+/, "").trim())
        .filter(Boolean)
        .map((title) => ({ title, text: "" }))
    : parsed.steps;
  const hookList = parsed.lists.find((l) => /hook/i.test(l.title));
  const otherLists: BriefList[] = parsed.lists.filter((l) => l !== hookList);

  const [steps, setSteps] = useState(startSteps.length ? startSteps : [{ title: "", text: "" }]);
  const [hooks, setHooks] = useState<string[]>(hookList?.items.length ? hookList.items : [""]);

  const filledSteps = steps.filter((s) => s.title.trim());
  const filledHooks = hooks.map((h) => h.trim()).filter(Boolean);
  const value = [
    ...filledSteps.map((s) => `## ${s.title.trim()}${s.text.trim() ? `\n${s.text.trim()}` : ""}`),
    ...(filledHooks.length ? [`### ${hookList?.title ?? HOOKS_TITLE}\n${filledHooks.map((h) => `- ${h}`).join("\n")}`] : []),
    ...otherLists.map((l) => `### ${l.title}\n${l.items.map((i) => `- ${i}`).join("\n")}`),
  ].join("\n");

  const input = "min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="flex flex-col gap-5">
      <input type="hidden" name={name} value={value} />

      <div>
        <p className="text-sm font-semibold text-foreground">Brief points</p>
        <p className="mb-2 text-xs text-muted-foreground">Numbered on the page: a short title, and a line under it.</p>
        <ol className="flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  value={s.title}
                  onChange={(e) => setSteps((x) => x.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))}
                  placeholder="Title, e.g. Read the full brief"
                  aria-label={`Point ${i + 1} title`}
                  className={`${input} font-semibold`}
                />
                <input
                  value={s.text}
                  onChange={(e) => setSteps((x) => x.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))}
                  placeholder="The line under it (optional)"
                  aria-label={`Point ${i + 1} text`}
                  className={input}
                />
              </div>
              <Remove label={`Remove point ${i + 1}`} onClick={() => setSteps((x) => (x.length === 1 ? [{ title: "", text: "" }] : x.filter((_, j) => j !== i)))} />
            </li>
          ))}
        </ol>
        <Add label="Add a point" onClick={() => setSteps((x) => [...x, { title: "", text: "" }])} />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{hookList?.title ?? HOOKS_TITLE}</p>
        <p className="mb-2 text-xs text-muted-foreground">Its own box under the brief, one hook per row.</p>
        <ul className="flex flex-col gap-2">
          {hooks.map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <input
                value={h}
                onChange={(e) => setHooks((x) => x.map((y, j) => (j === i ? e.target.value : y)))}
                placeholder="A hook, e.g. Why is your engagement so low?"
                aria-label={`Hook ${i + 1}`}
                className={`${input} flex-1`}
              />
              <Remove label={`Remove hook ${i + 1}`} onClick={() => setHooks((x) => (x.length === 1 ? [""] : x.filter((_, j) => j !== i)))} />
            </li>
          ))}
        </ul>
        <Add label="Add a hook" onClick={() => setHooks((x) => [...x, ""])} />
      </div>
    </div>
  );
}

function Remove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}

function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}
