"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { markBatchPaidAction, uploadWiseTemplateAction, type WiseState } from "./wise-actions";

function Submit({ children, pendingText }: { children: string; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}

function Message({ state }: { state: WiseState }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-semibold text-destructive">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
        {state.success}
      </p>
    );
  return null;
}

export function WisePanel({
  creators,
  total,
  missing,
  hasTemplate,
  lastBatch,
}: {
  creators: number;
  total: number;
  missing: { name: string; amount: number }[];
  hasTemplate: boolean;
  /** The last file downloaded, if any of it is still to be marked paid. */
  lastBatch: { total: number; createdAt: string } | null;
}) {
  const [templateState, templateAction] = useActionState<WiseState, FormData>(uploadWiseTemplateAction, {});
  const [paidState, paidAction] = useActionState<WiseState, FormData>(markBatchPaidAction, {});

  return (
    <section className="mb-6 flex flex-col gap-5 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-heading text-base font-semibold text-foreground">Pay with Wise</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {creators > 0
            ? `${creators} ${creators === 1 ? "creator" : "creators"} to pay, ${formatCurrency(total)} in total.`
            : "Nothing to pay right now."}
        </p>
        {missing.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Not in the file yet, because they haven&apos;t added bank details (we&apos;ve asked them):{" "}
            {missing.map((m) => `${m.name} (${formatCurrency(m.amount)})`).join(", ")}.
          </p>
        )}
        {creators > 0 && (
          <a
            href="/brand/payments/wise"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="size-4" />
            Download the Wise payment file
          </a>
        )}
      </div>

      {lastBatch && (
        <form action={paidAction} className="flex flex-col gap-3 border-t border-border/70 pt-4">
          <p className="text-[15px] font-semibold text-foreground">Paid it in Wise?</p>
          <p className="text-sm text-muted-foreground">
            For the file you downloaded ({formatCurrency(lastBatch.total)}). Add Wise&apos;s batch confirmation, a screenshot is fine.
          </p>
          <Field label="Wise confirmation (screenshot or PDF)" htmlFor="confirmation">
            <Input id="confirmation" name="confirmation" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
          </Field>
          <Field label="Batch reference (optional)" htmlFor="reference">
            <Input id="reference" name="reference" maxLength={200} placeholder="From Wise" />
          </Field>
          <Message state={paidState} />
          <div>
            <Submit pendingText="Saving…">I&apos;ve paid it</Submit>
          </div>
        </form>
      )}

      <details className="border-t border-border/70 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          {hasTemplate ? "Your Wise template is saved" : "First payout: add your Wise template"}
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1 pl-5">
            <li>In Wise Business, go to Payments, then Batch.</li>
            <li>Choose the &ldquo;Send to bank accounts&rdquo; template.</li>
            <li>Add one row for each currency your creators are paid in (for example USD to EUR, USD to GBP).</li>
            <li>Download it as CSV, blank, and upload it here.</li>
          </ol>
          <p>Payment files then use Wise&apos;s exact columns, so they upload without errors. You only need a new one when a creator in a new currency joins.</p>
          <form action={templateAction} className="flex flex-col gap-3">
            <Field label="Wise template (CSV)" htmlFor="template">
              <Input id="template" name="template" type="file" accept=".csv,text/csv" />
            </Field>
            <Message state={templateState} />
            <div>
              <Submit pendingText="Uploading…">{hasTemplate ? "Replace template" : "Upload template"}</Submit>
            </div>
          </form>
        </div>
      </details>
    </section>
  );
}
