"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Field, Input, Textarea } from "@/components/ui/field";
import { saveContractAction, type BrandPayState } from "./actions";
import type { ContractSection } from "@/lib/contract";
import type { ContractDetails } from "@/lib/post-terms";
import { formatDate } from "@/lib/utils";

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

/**
 * The brand's contract, inside its campaign: read it, fill in the company details, tick agree, Save. After that
 * it shows who agreed and when, and OnCamera sees the same on the campaign. If the pay terms change later it asks
 * for agreement again.
 */
export function ContractCard({
  jobId,
  status,
  contract,
  sections,
  wordHref,
}: {
  jobId: string;
  status: "none" | "signed" | "changed";
  contract: ContractDetails | null;
  sections: ContractSection[];
  wordHref: string;
}) {
  const [state, action] = useActionState<BrandPayState, FormData>(saveContractAction, {});
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    legal_name: contract?.legalName ?? "",
    country: contract?.country ?? "",
    address: contract?.address ?? "",
    signatory: contract?.signatory ?? "",
    role: contract?.signatoryRole ?? "",
  });
  const on = (k: keyof typeof f) => ({ value: f[k], onChange: (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value })) });
  const signed = status === "signed" && !editing;

  const text = (
    <details className="mt-3 rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-semibold text-foreground">Read the contract</summary>
      <div className="mt-3 space-y-3 text-muted-foreground">
        <p className="text-xs font-semibold text-destructive">Draft: have a lawyer review this before relying on it.</p>
        {sections.map((s) => (
          <div key={s.heading}>
            <p className="font-semibold text-foreground">{s.heading}</p>
            {s.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        ))}
        <a href={wordHref} className="inline-block font-semibold text-primary underline underline-offset-2">
          Download as a Word file
        </a>
      </div>
    </details>
  );

  if (signed && contract)
    return (
      <section className="mb-6 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold text-foreground">Contract</h2>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Signed</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {contract.legalName} · agreed by {contract.signatory} on {formatDate(contract.agreedAt)}
        </p>
        {text}
        <button type="button" onClick={() => setEditing(true)} className="mt-3 cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Change details
        </button>
      </section>
    );

  return (
    <section className="mb-6 rounded-xl border border-primary/40 bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold text-foreground">Contract</h2>
        {status === "changed" && (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">Pay terms changed: agree again</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Fill in your company details and agree. The pay terms are already in the contract.
      </p>
      {text}
      <form action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="job_id" value={jobId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company legal name" htmlFor="legal_name">
            <Input id="legal_name" name="legal_name" {...on("legal_name")} required />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input id="country" name="country" {...on("country")} required />
          </Field>
        </div>
        <Field label="Company address" htmlFor="address">
          <Textarea id="address" name="address" rows={2} {...on("address")} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name of the person agreeing" htmlFor="signatory">
            <Input id="signatory" name="signatory" {...on("signatory")} required />
          </Field>
          <Field label="Their role (optional)" htmlFor="role">
            <Input id="role" name="role" {...on("role")} />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" name="agree" className="mt-1 size-4" />
          <span>I have read the contract and agree to it on behalf of the company.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Save label="Save and sign" />
          {state.error && <span className="text-sm font-semibold text-destructive">{state.error}</span>}
          {state.success && <span className="text-sm font-semibold text-emerald-400">{state.success}</span>}
        </div>
      </form>
    </section>
  );
}
