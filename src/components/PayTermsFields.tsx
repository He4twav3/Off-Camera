import { Field, Input } from "@/components/ui/field";
import { cpmPhrases, type PostTerms } from "@/lib/post-terms";

const views = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The pay inputs: pay per video, how often it is paid, the counting window, how long a post stays public, and the CPM. */
export function PayTermsFields({ terms }: { terms: Pick<PostTerms, "basePerPost" | "cycleSize" | "windowDays" | "keepPublicDays" | "milestones" | "cpm"> }) {
  const rows = Array.from({ length: 4 }, (_, i) => terms.cpm?.[i] ?? null);
  const fixed = !terms.cpm?.length && terms.milestones.length > 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Pay per video ($)" htmlFor="base">
          <Input id="base" name="base" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={terms.basePerPost} required />
        </Field>
        <Field label="Paid after every … videos" htmlFor="cycle">
          <Input id="cycle" name="cycle" type="number" inputMode="numeric" min={1} defaultValue={terms.cycleSize} required />
        </Field>
        <Field label="Views count for … days" htmlFor="window">
          <Input id="window" name="window" type="number" inputMode="numeric" min={1} defaultValue={terms.windowDays} required />
        </Field>
        <Field label="Keep public … days" htmlFor="keep_public">
          <Input id="keep_public" name="keep_public" type="number" inputMode="numeric" min={0} defaultValue={terms.keepPublicDays} required />
        </Field>
      </div>
      <CpmRows rows={rows} />
      {fixed && (
        <p className="text-sm text-muted-foreground">
          Now paying fixed bonuses: {terms.milestones.map((m) => `${usd(m.amount)} at ${views(m.views)} views`).join(", ")}. Fill in a CPM above to replace them.
        </p>
      )}
    </div>
  );
}

/** CPM rows: the CPM, and the views it starts at. Leave a row blank to skip it. */
export function CpmRows({ rows }: { rows: ({ from: number; rate: number } | null)[] }) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-foreground">CPM</p>
      <div className="mt-2 grid max-w-md gap-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <Input name="cpm_rate" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={r?.rate ?? ""} placeholder="CPM ($)" aria-label={`CPM ${i + 1}: dollars per 1,000 views`} />
            <Input name="cpm_from" type="number" inputMode="numeric" min={0} defaultValue={r ? r.from : ""} placeholder="From views" aria-label={`CPM ${i + 1}: starts at this many views`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export { cpmPhrases };
