"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, TagPicker } from "@/components/ui/field";
import { Section } from "@/components/account/AccountShell";
import { PictureField } from "@/components/account/PictureField";
import { COUNTRIES } from "@/lib/validation";
import { saveProfileAction, type ProfileFormState } from "./actions";
import type { Applicant } from "@/lib/database.types";

const SKILL_OPTIONS = [
  "Editing",
  "On camera",
  "Voiceover",
  "Scriptwriting",
  "Graphic design",
  "Photography",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/** Splits a stored "City, Country" back into its two parts for editing. */
function splitLocation(location: string | null): {
  city: string;
  country: string;
} {
  if (!location) return { city: "", country: "" };
  const i = location.lastIndexOf(",");
  if (i === -1) return { city: "", country: location.trim() };
  return {
    city: location.slice(0, i).trim(),
    country: location.slice(i + 1).trim(),
  };
}

/** A stored full name back into first name and surname. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

/**
 * "Personal Information": the picture, then the details brands look at. Accounts are
 * connected on their own page, straight after the first save.
 */
export function ProfileForm({
  existing,
  defaultName,
}: {
  existing: Applicant | null;
  defaultName: string;
}) {
  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    saveProfileAction,
    {},
  );
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [brands, setBrands] = useState(
    (existing?.brands_worked_with ?? []).join(", "),
  );
  const { first, last } = splitName(existing?.name ?? defaultName);
  const where = splitLocation(existing?.location ?? null);
  const brandChips = brands
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 30);

  return (
    <Section
      title="Personal Information"
      summary="Update your name, username, and profile picture."
    >
      <PictureField
        name={existing?.name ?? defaultName}
        url={existing?.avatar_url ?? null}
        canUpload={Boolean(existing)}
      />

      <form action={formAction} className="flex flex-col gap-5">
        {skills.map((s) => (
          <input key={s} type="hidden" name="skills" value={s} />
        ))}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="first_name"
            required
            hint="Your name as it will appear on your profile."
          >
            <Input
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              defaultValue={first}
              placeholder="Alex"
              required
            />
          </Field>
          <Field label="Surname" htmlFor="last_name" required>
            <Input
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              defaultValue={last}
              placeholder="Rivera"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Username"
            htmlFor="username"
            required
            hint="Your unique username. Can only contain lowercase letters, numbers, and underscores."
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
            hint="You need to be 18 or older. Brands don't see this."
          >
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={existing?.date_of_birth ?? ""}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Country"
            htmlFor="country"
            required
            hint="Some campaigns are for one country only."
          >
            <Select
              id="country"
              name="country"
              defaultValue={where.country}
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
              defaultValue={where.city}
              placeholder="Thessaloniki"
              maxLength={60}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="text-[15px] font-semibold text-foreground">
            Skills{" "}
            <span className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              Optional
            </span>
          </legend>
          <div className="mt-3">
            <TagPicker
              options={SKILL_OPTIONS}
              selected={skills}
              onToggle={(item) =>
                setSkills((cur) =>
                  cur.includes(item)
                    ? cur.filter((s) => s !== item)
                    : [...cur, item],
                )
              }
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
            value={brands}
            onChange={(e) => setBrands(e.target.value)}
            placeholder="Gymshark, HelloFresh"
          />
        </Field>
        {brandChips.length > 0 && (
          <ul
            className="-mt-2 flex flex-wrap gap-2"
            aria-label="Brands you've worked with"
          >
            {brandChips.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 py-1 pr-3 pl-1 text-sm font-medium text-foreground"
              >
                <span
                  aria-hidden
                  className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
                >
                  {b[0]?.toUpperCase()}
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}

        {state.error && (
          <p
            role="alert"
            className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="text-sm font-semibold text-toy-soft-foreground">
            {state.success}
          </p>
        )}

        <SubmitButton label={existing ? "Save Changes" : "Save and continue"} />
      </form>
    </Section>
  );
}
