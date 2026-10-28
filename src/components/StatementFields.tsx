import type { PostTerms } from "@/lib/post-terms";
import { STATEMENT_DUE_DAYS } from "@/lib/direct-pay";

/** How often creators get a statement, and how long the brand has to pay it. */
export function StatementFields({ terms }: { terms: Pick<PostTerms, "statementEvery" | "dueDays"> }) {
  return (
    <fieldset>
      <legend className="text-[15px] font-semibold text-foreground">Statements</legend>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="statement_every" value="videos" defaultChecked={terms.statementEvery !== "month"} />
          After the videos per payment above
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="statement_every" value="month" defaultChecked={terms.statementEvery === "month"} />
          Once a month
        </label>
        <label className="flex items-center gap-2">
          Brand pays within
          <input
            name="due_days"
            type="number"
            min={1}
            max={90}
            step={1}
            defaultValue={terms.dueDays ?? STATEMENT_DUE_DAYS}
            className="h-8 w-16 rounded-md border border-border bg-background px-2"
          />
          days
        </label>
      </div>
    </fieldset>
  );
}
