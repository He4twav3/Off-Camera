"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { cleanupAction, type CleanupState } from "./actions";
import type { CleanupAccount, CleanupJob } from "@/lib/admin-cleanup";

function Go({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="cursor-pointer rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete selected for good"}
    </button>
  );
}

/** Tick what to delete (everything not kept starts ticked), type DELETE, press the button. */
export function CleanupForm({ accounts, campaigns }: { accounts: CleanupAccount[]; campaigns: CleanupJob[] }) {
  const [state, action] = useActionState<CleanupState, FormData>(cleanupAction, {});
  const [word, setWord] = useState("");
  const removable = accounts.filter((a) => !a.keptBecause);
  const removableJobs = campaigns.filter((c) => !c.keptBecause);

  if (state.done)
    return (
      <div className="rounded-lg border border-border bg-card p-5 text-sm">
        <p className="font-semibold text-foreground">Deleted {state.done.deleted}.</p>
        {state.done.failed.length > 0 && (
          <>
            <p className="mt-3 font-semibold text-destructive">These couldn&apos;t be deleted:</p>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {state.done.failed.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
        <a href="/admin/cleanup" className="mt-4 inline-block font-semibold text-primary underline underline-offset-2">
          Reload the list
        </a>
      </div>
    );

  const row = "flex items-start gap-3 px-4 py-2.5 text-sm";
  return (
    <form action={action} className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 font-heading text-base font-semibold text-foreground">Accounts</h2>
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {accounts.map((a) => (
            <li key={a.userId} className={row}>
              {a.keptBecause && !a.soft ? (
                <span aria-hidden className="mt-0.5 size-4 shrink-0" />
              ) : (
                <input type="checkbox" name="user" value={a.userId} defaultChecked={!a.keptBecause} className="mt-1 size-4 shrink-0" aria-label={`Delete ${a.email}`} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{a.email}</p>
                <p className="text-xs text-muted-foreground">
                  {a.kind}
                  {a.name ? ` · ${a.name}` : ""}
                  {a.detail ? ` · ${a.detail}` : ""}
                </p>
              </div>
              {a.keptBecause && (
                <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Kept · {a.keptBecause}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-heading text-base font-semibold text-foreground">Campaigns</h2>
        <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card">
          {campaigns.length === 0 && <li className={row}>No campaigns.</li>}
          {campaigns.map((c) => (
            <li key={c.id} className={row}>
              {c.keptBecause ? (
                <span aria-hidden className="mt-0.5 size-4 shrink-0" />
              ) : (
                <input type="checkbox" name="job" value={c.id} defaultChecked className="mt-1 size-4 shrink-0" aria-label={`Delete ${c.title}`} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.creators} {c.creators === 1 ? "creator" : "creators"} joined
                </p>
              </div>
              {c.keptBecause && (
                <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">Kept · {c.keptBecause}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <p className="font-semibold text-foreground">
          This deletes up to {removable.length} {removable.length === 1 ? "account" : "accounts"} and {removableJobs.length}{" "}
          {removableJobs.length === 1 ? "campaign" : "campaigns"}, with their videos, payments and sign-ins. It can&apos;t be undone.
        </p>
        <p className="mt-1 text-muted-foreground">Untick anything you want to keep. Admins and the Getimg account are never deleted here. A creator on Getimg&apos;s campaign is kept unless you tick them.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            name="confirm"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Type DELETE"
            aria-label="Type DELETE to confirm"
            className="w-40 rounded-md border border-border bg-background px-2 py-2"
          />
          <Go disabled={word !== "DELETE"} />
        </div>
        {state.error && <p className="mt-2 font-semibold text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}
