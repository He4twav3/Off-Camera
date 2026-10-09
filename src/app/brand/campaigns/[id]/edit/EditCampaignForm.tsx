"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ExampleLinksField } from "@/components/ExampleLinksField";
import { updateCampaignAction, type EditCampaignState } from "../../../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

/** Edit the brief of a campaign the brand owns. The pay terms are shown but not editable here. */
export function EditCampaignForm({
  campaign,
  niches,
}: {
  campaign: {
    id: string;
    title: string;
    nicheId: string;
    about: string;
    rules: string;
    formats: string;
    examples: string;
  };
  niches: { id: string; label: string }[];
}) {
  const [state, action] = useActionState<EditCampaignState, FormData>(updateCampaignAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="job_id" value={campaign.id} />
      <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5">
        <Field label="Campaign name" htmlFor="title">
          <Input id="title" name="title" required maxLength={120} defaultValue={campaign.title} />
        </Field>
        <Field label="Niche" htmlFor="niche_id">
          <Select id="niche_id" name="niche_id" defaultValue={campaign.nicheId} required>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="About your brand" htmlFor="about" hint="Creators see this before they join.">
          <Textarea id="about" name="about" maxLength={2000} defaultValue={campaign.about} />
        </Field>
      </section>
      <section className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5">
        <Field label="Rules" htmlFor="rules" hint="One line each. What every video must do or not do. Up to 12 lines.">
          <Textarea id="rules" name="rules" defaultValue={campaign.rules} className="min-h-40" />
        </Field>
        <Field label="Formats that work" htmlFor="formats" hint="One line each. Up to 8 lines.">
          <Textarea id="formats" name="formats" defaultValue={campaign.formats} />
        </Field>
        <Field label="Example videos and links" htmlFor="examples" hint="Show creators what you want. A TikTok, Instagram or YouTube post shows as a video card; any other link (a Drive folder, a website) shows as a link card. Up to 6, full https:// links.">
          <ExampleLinksField initial={campaign.examples} />
        </Field>
      </section>
      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && <p className="text-sm font-semibold text-emerald-400">{state.success}</p>}
      <div>
        <Save />
      </div>
    </form>
  );
}
