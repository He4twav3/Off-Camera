import { Field, Input, Select } from "@/components/ui/field";
import type { Requirements } from "@/lib/post-terms";

/** The campaign requirements the brand sets first: how many videos, how long, and anything else creators must know. */
const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
];

export function RequirementsFields({ initial, platforms }: { initial?: Requirements; platforms?: string[] }) {
  const on = (p: string) => (platforms ? platforms.includes(p) : true);
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-[15px] font-semibold text-foreground">Where creators post</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {PLATFORMS.map((p) => (
            <label key={p.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="platforms" value={p.value} defaultChecked={on(p.value)} className="size-4" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
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
