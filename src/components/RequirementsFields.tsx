import { Field, Input, Select } from "@/components/ui/field";
import type { Requirements } from "@/lib/post-terms";

/** The campaign requirements the brand sets first: how many videos, how long, and anything else creators must know. */
export function RequirementsFields({ initial }: { initial?: Requirements }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Videos expected" htmlFor="req_count">
          <Input id="req_count" name="req_count" type="number" inputMode="numeric" min={1} max={1000} defaultValue={initial?.count ?? ""} />
        </Field>
        <Field label="Per" htmlFor="req_period">
          <Select id="req_period" name="req_period" defaultValue={initial?.period ?? "week"}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </Select>
        </Field>
      </div>
      <Field label="Video length" htmlFor="req_length">
        <Input id="req_length" name="req_length" maxLength={60} defaultValue={initial?.length ?? ""} />
      </Field>
      <Field label="Anything else creators must know" htmlFor="req_note">
        <Input id="req_note" name="req_note" maxLength={300} defaultValue={initial?.note ?? ""} />
      </Field>
    </div>
  );
}
