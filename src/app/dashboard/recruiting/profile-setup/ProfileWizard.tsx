"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Field,
  Input,
  Select,
  Textarea,
  Checkbox,
  TagPicker,
} from "@/components/ui/field";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { EDUCATION_LEVELS, CONTENT_TYPES } from "@/lib/handles";
import { COUNTRIES, LANGUAGES, MIN_RATE } from "@/lib/validation";
import { HandlesField, type HandleDraft } from "./HandlesField";
import { saveProfileAction, type ProfileFormState } from "./actions";
import type { Applicant, ApplicantHandle } from "@/lib/database.types";

const SKILL_OPTIONS = [
  "Editing",
  "On camera",
  "Voiceover",
  "Scriptwriting",
  "Graphic design",
  "Photography",
];

const TOTAL_STEPS = 5;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : "Save my profile"}
    </Button>
  );
}

interface ProfileWizardProps {
  niches: { id: string; label: string }[];
  existing: Applicant | null;
  existingHandles: ApplicantHandle[];
  defaultName: string;
}

/** Splits a stored "City, Country" back into its two parts for editing. */
function splitLocation(location: string | null): { city: string; country: string } {
  if (!location) return { city: "", country: "" };
  const idx = location.lastIndexOf(", ");
  if (idx === -1) {
    return (COUNTRIES as readonly string[]).includes(location)
      ? { city: "", country: location }
      : { city: location, country: "" };
  }
  return { city: location.slice(0, idx), country: location.slice(idx + 2) };
}

export function ProfileWizard({
  niches,
  existing,
  existingHandles,
  defaultName,
}: ProfileWizardProps) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    saveProfileAction,
    {},
  );
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [contentTypes, setContentTypes] = useState<string[]>(
    existing?.content_types ?? [],
  );
  const [languages, setLanguages] = useState<string[]>(
    existing?.languages ?? [],
  );

  const initialLocation = splitLocation(existing?.location ?? null);

  const [handles, setHandles] = useState<HandleDraft[]>(() =>
    existingHandles.length > 0
      ? existingHandles.map((h) => ({
          key: h.id,
          platform: h.platform,
          handle: h.handle,
          follower_count: h.follower_count?.toString() ?? "",
        }))
      : [
          {
            key: "initial",
            platform: existing?.platform ?? "tiktok",
            handle: existing?.handle ?? "",
            follower_count: "",
          },
        ],
  );

  function toggler(list: string[], set: (v: string[]) => void) {
    return (item: string) =>
      set(list.includes(item) ? list.filter((s) => s !== item) : [...list, item]);
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-10">
      <StepIndicator current={step} total={TOTAL_STEPS} className="mb-8" />

      <form action={formAction}>
        {/* Multi-selects and the handle repeater post as hidden inputs so the
            whole form submits at once from the final step. */}
        {skills.map((s) => (
          <input key={s} type="hidden" name="skills" value={s} />
        ))}
        {contentTypes.map((c) => (
          <input key={c} type="hidden" name="content_types" value={c} />
        ))}
        {languages.map((l) => (
          <input key={l} type="hidden" name="languages" value={l} />
        ))}
        {handles.map((h) => (
          <div key={h.key}>
            <input type="hidden" name="handle_platform" value={h.platform} />
            <input type="hidden" name="handle_value" value={h.handle} />
            <input
              type="hidden"
              name="handle_followers"
              value={h.follower_count}
            />
          </div>
        ))}

        {/* ---- Step 1 ---- */}
        <fieldset className={step !== 1 ? "hidden" : undefined}>
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            First, the basics
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            This sits at the top of the profile we send with your applications.
          </p>
          <div className="mt-8 flex flex-col gap-5">
            <Field label="Your name" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                defaultValue={existing?.name ?? defaultName}
                placeholder="Alex Rivera"
                required
              />
            </Field>

            <Field
              label="Username"
              htmlFor="username"
              required
              hint="3–30 characters: lowercase letters, numbers and underscores."
            >
              <Input
                id="username"
                name="username"
                defaultValue={existing?.username ?? ""}
                placeholder="alexrivera"
                pattern="[a-z0-9_]{3,30}"
                required
              />
            </Field>

            <Field
              label="Date of birth"
              htmlFor="date_of_birth"
              required
              hint="You need to be 18 or older to take on campaigns."
            >
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={existing?.date_of_birth ?? ""}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country" htmlFor="country" required>
                <Select
                  id="country"
                  name="country"
                  defaultValue={initialLocation.country}
                  required
                >
                  <option value="">Choose…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="City" htmlFor="city" optional>
                <Input
                  id="city"
                  name="city"
                  defaultValue={initialLocation.city}
                  placeholder="Thessaloniki"
                  maxLength={60}
                />
              </Field>
            </div>
            <p className="-mt-2 text-sm text-muted-foreground">
              Some campaigns are region-specific, so country matters.
            </p>
          </div>
        </fieldset>

        {/* ---- Step 2 ---- */}
        <fieldset className={step !== 2 ? "hidden" : undefined}>
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            Where do you post?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Add every account you&apos;d use for brand work. The first is your
            main platform for matching.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            <HandlesField value={handles} onChange={setHandles} />

            <Field
              label="Niche you're interested in"
              htmlFor="niche_interest_id"
              optional
            >
              <Select
                id="niche_interest_id"
                name="niche_interest_id"
                defaultValue={existing?.niche_interest_id ?? ""}
              >
                <option value="">No preference</option>
                {niches.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </fieldset>

        {/* ---- Step 3 ---- */}
        <fieldset className={step !== 3 ? "hidden" : undefined}>
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            What have you made?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            This is the part brands actually read. All of it is optional — but
            the more you fill in, the better your odds.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            <Field
              label="Years making content"
              htmlFor="years_creating"
              optional
              hint="Half a year is fine — put 0.5."
            >
              <Input
                id="years_creating"
                name="years_creating"
                type="number"
                min={0}
                max={80}
                step="0.5"
                inputMode="decimal"
                defaultValue={existing?.years_creating ?? ""}
                placeholder="2"
                className="sm:max-w-40"
              />
            </Field>

            <fieldset>
              <legend className="font-heading text-[15px] font-semibold text-foreground">
                What kind of content?{" "}
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Optional
                </span>
              </legend>
              <div className="mt-3">
                <TagPicker
                  options={CONTENT_TYPES}
                  selected={contentTypes}
                  onToggle={toggler(contentTypes, setContentTypes)}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-heading text-[15px] font-semibold text-foreground">
                Your skills{" "}
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Optional
                </span>
              </legend>
              <div className="mt-3">
                <TagPicker
                  options={SKILL_OPTIONS}
                  selected={skills}
                  onToggle={toggler(skills, setSkills)}
                />
              </div>
            </fieldset>

            <Field
              label="Brands you've worked with"
              htmlFor="brands_worked_with"
              optional
              hint="Separate with commas. Leave blank if this would be your first."
            >
              <Input
                id="brands_worked_with"
                name="brands_worked_with"
                defaultValue={existing?.brands_worked_with?.join(", ") ?? ""}
                placeholder="Gymshark, HelloFresh"
              />
            </Field>

            <Field
              label="Anything else about your experience"
              htmlFor="experience_summary"
              optional
            >
              <Textarea
                id="experience_summary"
                name="experience_summary"
                defaultValue={existing?.experience_summary ?? ""}
                placeholder="I've made short-form beauty content for two years, mostly tutorials and product tests."
                maxLength={1500}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---- Step 4 ---- */}
        <fieldset className={step !== 4 ? "hidden" : undefined}>
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            Languages and rate
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Your rate range filters which campaigns we show you, so it&apos;s
            worth getting right.
          </p>
          <div className="mt-8 flex flex-col gap-6">
            <fieldset>
              <legend className="font-heading text-[15px] font-semibold text-foreground">
                Languages you can create in{" "}
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Optional
                </span>
              </legend>
              <div className="mt-3">
                <TagPicker
                  options={LANGUAGES}
                  selected={languages}
                  onToggle={toggler(languages, setLanguages)}
                  columns
                />
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Minimum rate"
                htmlFor="preferred_pay_min"
                optional
                hint={`USD, at least $${MIN_RATE}.`}
              >
                <Input
                  id="preferred_pay_min"
                  name="preferred_pay_min"
                  type="number"
                  min={MIN_RATE}
                  step="1"
                  inputMode="decimal"
                  defaultValue={existing?.preferred_pay_min ?? ""}
                  placeholder="75"
                />
              </Field>
              <Field
                label="Maximum rate"
                htmlFor="preferred_pay_max"
                optional
                hint="USD."
              >
                <Input
                  id="preferred_pay_max"
                  name="preferred_pay_max"
                  type="number"
                  min={MIN_RATE}
                  step="1"
                  inputMode="decimal"
                  defaultValue={existing?.preferred_pay_max ?? ""}
                  placeholder="400"
                />
              </Field>
            </div>
            <p className="-mt-3 text-sm text-muted-foreground">
              Leave both blank if you&apos;re open to anything.
            </p>

            <Field label="Education" htmlFor="education_level" optional>
              <Select
                id="education_level"
                name="education_level"
                defaultValue={existing?.education_level ?? ""}
              >
                <option value="">Prefer not to say</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="What did you study?"
              htmlFor="education"
              optional
              hint="Subject and place. Leave blank rather than guessing."
            >
              <Input
                id="education"
                name="education"
                defaultValue={existing?.education ?? ""}
                placeholder="Film Production, Leeds"
                maxLength={200}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---- Step 5 ---- */}
        <fieldset className={step !== 5 ? "hidden" : undefined}>
          <h1 className="font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            Last bit
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            All optional, and you can change any of it later.
          </p>
          <div className="mt-8 flex flex-col gap-5">
            <Field label="Short bio" htmlFor="bio" optional>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={existing?.bio ?? ""}
                placeholder="A couple of lines about you and your audience."
                maxLength={1000}
              />
            </Field>

            <Field
              label="Portfolio or best-work link"
              htmlFor="portfolio_url"
              optional
              hint="A profile link or a reel is fine."
            >
              <Input
                id="portfolio_url"
                name="portfolio_url"
                type="url"
                defaultValue={existing?.portfolio_url ?? ""}
                placeholder="https://tiktok.com/@alexcreates"
              />
            </Field>

            <Field label="Availability" htmlFor="availability_notes" optional>
              <Textarea
                id="availability_notes"
                name="availability_notes"
                defaultValue={existing?.availability_notes ?? ""}
                placeholder="e.g. I can turn around 2–3 videos a week."
                maxLength={500}
              />
            </Field>

            <div className="border-t border-border pt-5">
              <Checkbox
                id="weekly_digest_opt_in"
                name="weekly_digest_opt_in"
                defaultChecked={existing?.weekly_digest_opt_in ?? false}
                label="Email me a weekly round-up of new campaigns in my niche. (Optional — unsubscribe anytime.)"
              />
            </div>
          </div>
        </fieldset>

        {state.error && (
          <p
            role="alert"
            className="mt-6 rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {state.error}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            >
              Continue
            </Button>
          ) : (
            <SubmitButton />
          )}

          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="cursor-pointer self-center text-[15px] font-semibold text-muted-foreground underline underline-offset-2 transition-colors duration-200 hover:text-primary"
            >
              Back
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
