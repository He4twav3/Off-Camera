"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { COUNTRY_CODES, CURRENCIES, FIELD_LABEL, STATE_COUNTRIES, type BankDetails } from "@/lib/bank-details";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { reportNotPaidAction, saveBankDetailsAction, type DirectState } from "./direct-actions";

function Submit({ children, pendingText }: { children: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

function Message({ state }: { state: DirectState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
        {state.success}
      </p>
    );
  }
  return null;
}

/** Where brands send the money: the creator's own bank account, paid through the brand's Wise batch. */
export function BankDetailsForm({ saved }: { saved: { summary: string; details: BankDetails } | null }) {
  const [state, formAction] = useActionState<DirectState, FormData>(saveBankDetailsAction, {});
  const [editing, setEditing] = useState(!saved);
  const d = saved?.details;
  const [currency, setCurrency] = useState(d?.currency ?? "EUR");
  const [country, setCountry] = useState(d?.country ?? "");
  const countries = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      /* older browsers: show the codes */
    }
    return COUNTRY_CODES.map((c) => ({ code: c, name: names?.of(c) ?? c })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const spec = CURRENCIES[currency];

  if (saved && !editing && !state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[15px] font-semibold text-foreground">{saved.summary}</p>
        <p className="text-sm text-muted-foreground">
          {saved.details.holderName} · {saved.details.city}, {saved.details.country}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
            Change bank details
          </Button>
          <form action={formAction}>
            <input type="hidden" name="remove" value="1" />
            <Button type="submit" size="sm" variant="outline">
              Remove
            </Button>
          </form>
        </div>
        <Message state={state} />
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Brands pay you straight into your own bank account through Wise. You don&apos;t need a Wise account. Amounts are set in US dollars and Wise converts them to your currency. We only ever need your bank account details, like your IBAN.{" "}
        <strong className="text-foreground">Never enter a card number.</strong>
      </p>

      <Field label="Currency of your bank account" htmlFor="currency">
        <Select id="currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <option key={code} value={code}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Account holder name" htmlFor="holderName" hint="Your full name, exactly as it is on your bank account.">
        <Input id="holderName" name="holderName" defaultValue={d?.holderName ?? ""} maxLength={100} autoComplete="name" required />
      </Field>

      {spec.fields.map((f) =>
        f === "accountType" ? (
          <Field key={f} label={FIELD_LABEL[f].label} htmlFor={f}>
            <Select id={f} name={f} defaultValue={d?.bank.accountType ?? "CHECKING"}>
              <option value="CHECKING">Checking</option>
              <option value="SAVINGS">Savings</option>
            </Select>
          </Field>
        ) : (
          <Field key={`${currency}-${f}`} label={FIELD_LABEL[f].label} htmlFor={f} hint={FIELD_LABEL[f].hint}>
            <Input id={f} name={f} placeholder={FIELD_LABEL[f].placeholder} autoComplete="off" spellCheck={false} required={f !== "bic"} maxLength={40} />
          </Field>
        ),
      )}

      <p className="pt-2 text-[15px] font-semibold text-foreground">Your address</p>
      <p className="-mt-3 text-sm text-muted-foreground">Wise needs it to send the transfer. It&apos;s only shared in the brand&apos;s Wise payment.</p>
      <Field label="Country you live in" htmlFor="country">
        <Select id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} required>
          <option value="">Choose…</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Street address" htmlFor="address">
        <Input id="address" name="address" defaultValue={d?.address ?? ""} maxLength={100} autoComplete="address-line1" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={d?.city ?? ""} maxLength={100} autoComplete="address-level2" required />
        </Field>
        <Field label="Postcode" htmlFor="postCode">
          <Input id="postCode" name="postCode" defaultValue={d?.postCode ?? ""} maxLength={20} autoComplete="postal-code" />
        </Field>
      </div>
      {STATE_COUNTRIES.includes(country) && (
        <Field label="State or province" htmlFor="state">
          <Input id="state" name="state" defaultValue={d?.state ?? ""} maxLength={100} autoComplete="address-level1" required />
        </Field>
      )}

      <Message state={state} />
      <div className="flex gap-3">
        <Submit pendingText="Saving…">Save bank details</Submit>
        {saved && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ReportNotPaid({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<DirectState, FormData>(reportNotPaidAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-9 cursor-pointer text-sm font-semibold text-destructive underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
      >
        I haven&apos;t been paid
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Field label="What happened? (optional)" htmlFor={`note-${id}`} hint="We'll follow up with the brand.">
        <Textarea id={`note-${id}`} name="note" maxLength={500} />
      </Field>
      <Message state={state} />
      <div className="flex gap-3">
        <Submit pendingText="Sending…">Tell us I wasn&apos;t paid</Submit>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
