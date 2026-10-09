"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCampaignAction, type ApplyState } from "./actions";

function JoinButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Applying…" : "Apply to this campaign"}
    </Button>
  );
}

/** Two steps: read and accept the guidelines, then you're on the campaign. */
export function JoinSteps({
  jobId,
  title,
  brief,
  payLines = [],
  contract = null,
  campaignPath,
}: {
  jobId: string;
  title: string;
  brief: string | null;
  /** The pay rules in plain sentences, for a campaign paid per post. Part of what you accept. */
  payLines?: string[];
  /** The brand's signed contract, in sections, when it has one. The tick below then covers it. */
  contract?: { heading: string; lines: string[] }[] | null;
  campaignPath: string;
}) {
  const [state, formAction] = useActionState<ApplyState, FormData>(
    joinCampaignAction,
    {},
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-6">
        <ol className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">
                Read the guidelines
              </p>
              <p className="text-sm text-muted-foreground">
                Done. You&apos;re on this campaign.
              </p>
            </div>
          </li>
        </ol>
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={campaignPath} />}
        >
          Start posting
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="job_id" value={jobId} />

      <section>
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            1
          </span>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Read the guidelines
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          What the brand wants, and the rules every video follows.
        </p>

        <div className="mt-4 rounded-xl border border-border/70 bg-card p-5">
          {brief ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
              {brief}
            </p>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              No extra guidelines for this campaign. Follow the pay terms and
              post honestly.
            </p>
          )}
          {payLines.length > 0 && (
            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="text-sm font-semibold text-foreground">
                How you&apos;re paid
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {payLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {contract && (
          <details className="mt-4 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-foreground">Read the contract with the brand</summary>
            <div className="mt-3 space-y-3 text-muted-foreground">
              {contract.map((sec) => (
                <div key={sec.heading}>
                  <p className="font-semibold text-foreground">{sec.heading}</p>
                  {sec.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        )}

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px] text-foreground">
          <input
            type="checkbox"
            name="accepted"
            required
            className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
          />
          <span>{contract ? `I have read the contract and the guidelines for ${title}, and I agree to them.` : `I accept the guidelines for ${title}.`}</span>
        </label>
      </section>

      {state.error && (
        <p
          role="alert"
          className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}

      <JoinButton />
    </form>
  );
}
