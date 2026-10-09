import { Field, Input } from "@/components/ui/field";
import type { PostTerms } from "@/lib/post-terms";

/** The pay terms inputs: pay per video, how often it is paid, the counting window, how long a post stays public, the bonuses. */
export function PayTermsFields({ terms }: { terms: Pick<PostTerms, "basePerPost" | "cycleSize" | "windowDays" | "keepPublicDays" | "milestones" | "repostsEarnBase"> }) {
  const rows = Array.from({ length: 6 }, (_, i) => terms.milestones[i] ?? null);
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
      <div>
        <p className="text-[15px] font-semibold text-foreground">View bonuses</p>
        <div className="mt-2 grid max-w-md gap-2">
          {rows.map((m, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <Input name="ms_views" type="number" inputMode="numeric" min={1} defaultValue={m?.views ?? ""} placeholder="Views" aria-label={`Bonus ${i + 1}: views`} />
              <Input name="ms_amount" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={m?.amount ?? ""} placeholder="Bonus ($)" aria-label={`Bonus ${i + 1}: amount`} />
            </div>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input type="checkbox" name="reposts_earn_base" defaultChecked={terms.repostsEarnBase} className="mt-0.5 size-4" />
        <span>Every post earns the base pay, including reposts of the same video</span>
      </label>
    </div>
  );
}
