"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { saveJobAction, type JobFormState } from "./actions";
import type { Job } from "@/lib/database.types";

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
  job?: Job;
}

export function JobForm({ niches, job }: JobFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<JobFormState, FormData>(
    saveJobAction,
    {},
  );

  const isEdit = Boolean(job);

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
