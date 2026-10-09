"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ExampleLinksField } from "@/components/ExampleLinksField";
import { HowYouPay } from "../../HowYouPay";
import { createCampaignAction, type NewCampaignState } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Posting…" : "Post campaign"}
    </Button>
  );
}

const PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube" },
];

const DEFAULT_BONUSES = [
  { views: "1000", amount: "2" },
  { views: "5000", amount: "10" },
  { views: "10000", amount: "20" },
  { views: "100000", amount: "200" },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Create and post a campaign: the brief, the pay per video, view bonuses and who reviews. */
export function NewCampaignForm({ niches }: { niches: { id: string; label: string }[] }) {
  const [state, action] = useActionState<NewCampaignState, FormData>(createCampaignAction, {});
  // After a mistake the form is put back as it was typed, so nothing is lost.
  const f = state.values?.fields ?? {};
  const val = (name: string, fallback = "") => f[name] ?? fallback;
  const platformOn = (p: string) => (state.values ? state.values.platforms.includes(p) : true);
  return (
    <form action={action} className="flex flex-col gap-5">
      <Section title="Approving videos" hint="Every video is checked before it is paid. You can change this later.">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Who reviews each video</legend>
          <label className="cursor-pointer rounded-lg border border-border/70 p-3 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
            <input type="radio" name="reviewer" value="oncamera" defaultChecked={val("reviewer", "oncamera") === "oncamera"} className="mr-2" />
            <span className="text-sm font-semibold text-foreground">OnCamera approves</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">We check every video for you. Nothing for you to do.</span>
          </label>
          <label className="cursor-pointer rounded-lg border border-border/70 p-3 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
            <input type="radio" name="reviewer" value="brand" defaultChecked={val("reviewer") === "brand"} className="mr-2" />
            <span className="text-sm font-semibold text-foreground">I approve</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">You approve or deny each video yourself.</span>
          </label>
        </fieldset>
      </Section>

      <Section title="The campaign">
        <Field label="Campaign name" htmlFor="title" hint="What creators see on the campaign card.">
          <Input id="title" name="title" required maxLength={120} defaultValue={val("title")} placeholder="e.g. Spring launch" />
        </Field>
        <Field label="Niche" htmlFor="niche_id">
          <Select key={`niche-${val("niche_id")}`} id="niche_id" name="niche_id" defaultValue={val("niche_id")} required>
            <option value="">Pick a niche</option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="text-[15px] font-semibold text-foreground">Where creators post</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {PLATFORMS.map((p) => (
              <label key={p.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input type="checkbox" name="platforms" value={p.value} defaultChecked={platformOn(p.value)} className="size-4" />
                {p.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="About your brand" htmlFor="about" hint="Two or three sentences creators see before they join.">
          <Textarea id="about" name="about" maxLength={2000} defaultValue={val("about")} />
        </Field>
      </Section>

      <Section title="The brief" hint="One line each. Creators see these on the campaign page.">
        <Field label="Rules" htmlFor="rules" hint="What every video must do or not do. Up to 12 lines.">
          <Textarea id="rules" name="rules" defaultValue={val("rules")} placeholder={"Show the product in the first 3 seconds\nNo repeats or bulk posting"} />
        </Field>
        <Field label="Formats that work" htmlFor="formats" hint="Ideas that perform. Up to 8 lines.">
          <Textarea id="formats" name="formats" defaultValue={val("formats")} placeholder={"Talking head with a bold line of text\nScreen recording with step-by-step overlays"} />
        </Field>
        <Field label="Example videos and links" htmlFor="examples" hint="Show creators what you want. TikTok, Instagram and YouTube posts show as video cards; other links show as link cards. Up to 6 full https:// links.">
          <ExampleLinksField />
        </Field>
      </Section>

      <Section title="Pay" hint="Creators are paid per unique video, plus a bonus when it reaches a view milestone. Bonuses don't stack.">
        <HowYouPay />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pay per video ($)" htmlFor="base">
            <Input id="base" name="base" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={val("base", "20")} required />
          </Field>
          <Field label="Paid after every … videos" htmlFor="cycle" hint="A payment is due each time a creator delivers this many videos.">
            <Input id="cycle" name="cycle" type="number" inputMode="numeric" min={1} defaultValue={val("cycle", "15")} required />
          </Field>
          <Field label="Views count for … days" htmlFor="window" hint="Only views inside this window count, then the number is final.">
            <Input id="window" name="window" type="number" inputMode="numeric" min={1} defaultValue={val("window", "30")} required />
          </Field>
          <Field label="Keep each video public for … days" htmlFor="keep_public">
            <Input id="keep_public" name="keep_public" type="number" inputMode="numeric" min={0} defaultValue={val("keep_public", "90")} required />
          </Field>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">View bonuses</p>
          <p className="text-sm text-muted-foreground">Leave a row empty to skip it.</p>
          <div className="mt-2 grid gap-2">
            {DEFAULT_BONUSES.map((b, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Input name="ms_views" type="number" inputMode="numeric" min={1} defaultValue={state.values ? (state.values.msViews[i] ?? "") : b.views} aria-label={`Bonus ${i + 1}: views`} placeholder="Views" />
                <Input name="ms_amount" type="number" inputMode="decimal" min={0} step="0.01" defaultValue={state.values ? (state.values.msAmount[i] ?? "") : b.amount} aria-label={`Bonus ${i + 1}: amount`} placeholder="Bonus ($)" />
              </div>
            ))}
          </div>
        </div>
      </Section>


      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      <div>
        <Submit />
        <p className="mt-2 text-sm text-muted-foreground">
          The campaign goes live straight away. You can add a logo and close it any time from the campaign page.
        </p>
      </div>
    </form>
  );
}
