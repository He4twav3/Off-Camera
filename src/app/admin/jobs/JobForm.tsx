"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveJobAction, type JobFormState } from "./actions";
import type { Job } from "@/lib/database.types";
import { parsePayoutTerms } from "@/lib/payout-terms";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create job"}
    </Button>
  );
}

interface JobFormProps {
  niches: { id: string; label: string }[];
  brands?: { id: string; company_name: string }[];
  job?: Job;
}

export function JobForm({ niches, brands = [], job }: JobFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<JobFormState, FormData>(
    saveJobAction,
    {},
  );

  const isEdit = Boolean(job);
  const terms = job ? parsePayoutTerms(job.payout_terms) : null;
  const k = job?.id ?? "new";

  if (!open) {
    return (
      <Button
        variant={isEdit ? "outline" : "default"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isEdit ? (
          <>
            <Pencil size={18} />
            Edit
          </>
        ) : (
          <>
            <Plus size={18} />
            New job
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className={isEdit ? "mt-4 border-border/70" : "mb-6 border-border/70"}>
      <CardContent>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {isEdit ? "Edit job" : "New job"}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close form"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <X size={20} />
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {job && <input type="hidden" name="id" value={job.id} />}

        <Field label="Title" htmlFor={`title-${job?.id ?? "new"}`}>
          <Input
            id={`title-${job?.id ?? "new"}`}
            name="title"
            defaultValue={job?.title ?? ""}
            placeholder="Crypto exchange app walkthrough"
            required
          />
        </Field>

        <Field
          label="Description"
          htmlFor={`description-${job?.id ?? "new"}`}
          hint="Shown on the job page and in the assigned creator's brief. Keep brand names out until assignment."
        >
          <Textarea
            id={`description-${job?.id ?? "new"}`}
            name="description"
            defaultValue={job?.description ?? ""}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Platform" htmlFor={`platform-${job?.id ?? "new"}`}>
            <Select
              id={`platform-${job?.id ?? "new"}`}
              name="platform"
              defaultValue={job?.platform ?? "tiktok"}
              required
            >
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="x">X</option>
            </Select>
          </Field>

          <Field label="Niche" htmlFor={`niche-${job?.id ?? "new"}`}>
            <Select
              id={`niche-${job?.id ?? "new"}`}
              name="niche_id"
              defaultValue={job?.niche_id ?? ""}
              required
            >
              <option value="">Pick a niche</option>
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Brand (optional)" htmlFor={`brand-${job?.id ?? "new"}`}>
            <Select
              id={`brand-${job?.id ?? "new"}`}
              name="brand_account_id"
              defaultValue={job?.brand_account_id ?? ""}
            >
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.company_name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Payout type" htmlFor={`payout-type-${job?.id ?? "new"}`}>
            <Select
              id={`payout-type-${job?.id ?? "new"}`}
              name="payout_type"
              defaultValue={job?.payout_type ?? "flat"}
              required
            >
              <option value="flat">Flat fee</option>
              <option value="cpm">CPM</option>
              <option value="retainer">Retainer</option>
            </Select>
          </Field>

          <Field
            label="Payout amount"
            htmlFor={`payout-amount-${job?.id ?? "new"}`}
            hint="Shown publicly on the job board."
          >
            <Input
              id={`payout-amount-${job?.id ?? "new"}`}
              name="payout_amount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={job?.payout_amount ?? ""}
              required
            />
          </Field>

          <Field
            label="Account requirement"
            htmlFor={`account-${job?.id ?? "new"}`}
          >
            <Select
              id={`account-${job?.id ?? "new"}`}
              name="account_requirement"
              defaultValue={job?.account_requirement ?? "new_ok"}
              required
            >
              <option value="new_ok">New accounts OK</option>
              <option value="established_required">Established required</option>
            </Select>
          </Field>

          <Field label="Status" htmlFor={`status-${job?.id ?? "new"}`}>
            <Select
              id={`status-${job?.id ?? "new"}`}
              name="status"
              defaultValue={job?.status ?? "open"}
              required
            >
              <option value="open">Open</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>
        </div>

        <Field
          label="Payout notes"
          htmlFor={`payout-notes-${job?.id ?? "new"}`}
          hint="Optional. e.g. 'Paid per approved video, 2 revisions included'."
        >
          <Input
            id={`payout-notes-${job?.id ?? "new"}`}
            name="payout_notes"
            defaultValue={job?.payout_notes ?? ""}
          />
        </Field>

        <fieldset className="flex flex-col gap-5 rounded-md border border-border/70 p-4">
          <legend className="px-2 text-sm font-semibold text-foreground">
            Payout formula (optional)
          </legend>
          <p className="text-sm text-muted-foreground">
            Set what this brand pays per creator. Use any mix: a fixed fee, a
            rate per 1,000 views, milestone bonuses. Leave a part empty to skip
            it. Payouts are suggested from this and the contract is generated
            from it.
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Videos per creator" htmlFor={`videos-${k}`}>
              <Input id={`videos-${k}`} name="videos" type="number" min={1} max={50} defaultValue={terms?.videos ?? 1} />
            </Field>
            <Field label="Fixed fee per video ($)" htmlFor={`fixed-${k}`}>
              <Input id={`fixed-${k}`} name="fixed_per_video" type="number" min={0} step="0.01" defaultValue={terms?.fixedPerVideo || ""} />
            </Field>
            <Field label="Rate per 1,000 views ($)" htmlFor={`cpm-${k}`}>
              <Input id={`cpm-${k}`} name="cpm_rate" type="number" min={0} step="0.01" defaultValue={terms?.cpm?.ratePer1000 ?? ""} />
            </Field>
            <Field label="Rate starts after (views)" htmlFor={`cpmstart-${k}`} hint="0 = counts from the first view.">
              <Input id={`cpmstart-${k}`} name="cpm_starts_at" type="number" min={0} step="1" defaultValue={terms?.cpm?.startsAt ?? ""} />
            </Field>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-3 sm:col-span-2">
                <Field label={`Bonus ${i + 1}: at views`} htmlFor={`b${i}v-${k}`}>
                  <Input id={`b${i}v-${k}`} name={`bonus${i + 1}_views`} type="number" min={0} step="1" defaultValue={terms?.bonuses[i]?.views ?? ""} />
                </Field>
                <Field label={`Bonus ${i + 1}: amount ($)`} htmlFor={`b${i}a-${k}`}>
                  <Input id={`b${i}a-${k}`} name={`bonus${i + 1}_amount`} type="number" min={0} step="0.01" defaultValue={terms?.bonuses[i]?.amount ?? ""} />
                </Field>
              </div>
            ))}
            <Field label="Max payout per creator ($)" htmlFor={`cap-${k}`} hint="Optional cap.">
              <Input id={`cap-${k}`} name="cap_per_creator" type="number" min={0} step="0.01" defaultValue={terms?.capPerCreator ?? ""} />
            </Field>
            <Field label="Views counted for (days)" htmlFor={`days-${k}`}>
              <Input id={`days-${k}`} name="measure_days" type="number" min={1} max={365} defaultValue={terms?.measureDays ?? 30} />
            </Field>
            <Field label="Fixed fee paid" htmlFor={`paidon-${k}`}>
              <Select id={`paidon-${k}`} name="fixed_paid_on" defaultValue={terms?.fixedPaidOn ?? "approval"}>
                <option value="approval">When the video is approved</option>
                <option value="end">At the end of the campaign</option>
              </Select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-md border border-border/70 p-4">
          <legend className="px-2 text-sm font-semibold text-foreground">
            Sample video (optional)
          </legend>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-foreground">
            <input
              type="checkbox"
              name="sample_required"
              defaultChecked={job?.sample_required ?? false}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span>
              Ask applicants for a sample video
              <span className="block text-sm text-muted-foreground">
                Leave this off for a normal application. When it is on, creators
                must attach a Google Drive link to apply.
              </span>
            </span>
          </label>
          <Field
            label="What should the sample show?"
            htmlFor={`sample-criteria-${k}`}
            hint="Shown to creators when they apply. e.g. '30 seconds, show the app on screen, talk to camera'."
          >
            <Textarea
              id={`sample-criteria-${k}`}
              name="sample_criteria"
              defaultValue={job?.sample_criteria ?? ""}
              maxLength={1000}
            />
          </Field>
        </fieldset>

        <Field
          label="Affiliate link (optional)"
          htmlFor={`affiliate-${k}`}
          hint="From the brand, if they run an affiliate program (most make theirs in Dub). Assigned creators see it with the brief. Leave empty if there isn't one."
        >
          <Input
            id={`affiliate-${k}`}
            name="affiliate_url"
            type="url"
            defaultValue={job?.affiliate_url ?? ""}
            placeholder="https://dub.sh/..."
          />
        </Field>

        <Field
          label="Notion SOP link"
          htmlFor={`notion-${job?.id ?? "new"}`}
          hint="The instructions doc the assigned creator sees on their dashboard."
        >
          <Input
            id={`notion-${job?.id ?? "new"}`}
            name="notion_sop_url"
            type="url"
            defaultValue={job?.notion_sop_url ?? ""}
            placeholder="https://www.notion.so/..."
          />
        </Field>

        {state.error && (
          <p
            role="alert"
            className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            role="status"
            className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground"
          >
            {state.success}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <SubmitButton isEdit={isEdit} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
      </CardContent>
    </Card>
  );
}
