import { Field, Input } from "@/components/ui/field";
import type { PostTerms } from "@/lib/post-terms";
import { CpmRows } from "@/components/CpmRows";

const views = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n));
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The pay inputs: pay per video, how often it is paid, the counting window, how long a post stays public, and the CPM. */
export function PayTermsFields({ terms }: { terms: Pick<PostTerms, "basePerPost" | "cycleSize" | "windowDays" | "keepPublicDays" | "milestones" | "cpm" | "cpmCap"> }) {
  const rows = terms.cpm ?? [];
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
      <CpmRows rows={rows} cap={terms.cpmCap} />
      {fixed && (
        <p className="text-sm text-muted-foreground">
          Now paying fixed bonuses: {terms.milestones.map((m) => `${usd(m.amount)} at ${views(m.views)} views`).join(", ")}. Fill in a CPM above to replace them.
        </p>
      )}
    </div>
  );
}

