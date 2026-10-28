"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ExampleLinksField } from "@/components/ExampleLinksField";
import { RequirementsFields } from "@/components/RequirementsFields";
import { PayTermsFields } from "@/components/PayTermsFields";
import { BriefRowsField } from "@/components/BriefRowsField";
import { FormGroup } from "@/components/FormGroup";
import { BookOpen, LayoutTemplate, Wallet } from "lucide-react";
import { MAX_GUIDE_LENGTH } from "@/lib/campaign-guide";
import type { PostTerms, Requirements } from "@/lib/post-terms";
import { updateCampaignAction, type EditCampaignState } from "../../../actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

/**
 * Edit a campaign the brand owns, in the same two marked parts as the admin editor: what shows on the campaign page
 * (the brand note, the brief points and hooks, the example videos) and what is in the full brief (the product guide,
 * the scripts, the formats and how it pays).
 */
export function EditCampaignForm({
  campaign,
  niches,
}: {
  campaign: {
    id: string;
    title: string;
    nicheId: string;
    about: string;
    description: string;
    guide: string;
    scripts: string;
    formats: string;
    examples: string;
    platforms: string[];
    platformValues: string[];
    requirements?: Requirements;
    pay: PostTerms | null;
    hasCreators: boolean;
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
      </section>

      <FormGroup
        icon={<LayoutTemplate className="size-4" />}
        title="On the campaign page"
        note="The short version every creator sees first: your brand note, the requirements, the brief points, the hooks and the example videos. The pay strip at the top is made from Payment below."
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">Requirements</p>
          <RequirementsFields initial={campaign.requirements} platforms={campaign.platformValues} />
        </div>
        <Field label="About your brand" htmlFor="about" hint="Creators see this before they join.">
          <Textarea id="about" name="about" maxLength={2000} defaultValue={campaign.about} />
        </Field>
        <Field label="The brief" htmlFor="description" hint="Short numbered points, then the hooks in their own box. Add or remove rows as you need.">
          <BriefRowsField name="description" initial={campaign.description} />
        </Field>
        <Field label="Example videos and links" htmlFor="examples" hint="Show creators what you want. Upload a video, or paste TikTok, Instagram or YouTube posts (full https:// links), up to 6. Uploaded videos always play on the page.">
          <ExampleLinksField initial={campaign.examples} />
        </Field>
      </FormGroup>

      <FormGroup
        icon={<BookOpen className="size-4" />}
        title="In the full brief"
        note="Opens from the Read the full brief button: the longer parts creators read before filming."
      >
        <Field label="Product guide" htmlFor="guide" hint="What your product is and does. Use ## for a heading, - for a list and **bold**.">
          <Textarea id="guide" name="guide" defaultValue={campaign.guide} rows={10} maxLength={MAX_GUIDE_LENGTH} />
        </Field>
        <Field label="Scripts" htmlFor="scripts" hint="Start each script with ### and its title, then its lines as a - list. Lines before the first ### show above all the scripts.">
          <Textarea id="scripts" name="scripts" defaultValue={campaign.scripts} rows={12} maxLength={MAX_GUIDE_LENGTH} />
        </Field>
        <Field label="Formats that work" htmlFor="formats" hint="One line each, up to 8. Shown only when there are no scripts.">
          <Textarea id="formats" name="formats" defaultValue={campaign.formats} />
        </Field>
        {campaign.pay && (
          <div className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card p-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wallet className="size-4 text-primary" />
                Payment
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Filled in once. The pay strip at the top of the campaign page and the How it pays section of the full brief
                are written from it.
              </p>
            </div>
            <PayTermsFields terms={campaign.pay} />
            {campaign.hasCreators && (
              <p className="text-sm text-muted-foreground">Creators are already on this campaign: a change applies to all their videos.</p>
            )}
          </div>
        )}
      </FormGroup>
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
