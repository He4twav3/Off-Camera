"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field, Input } from "@/components/ui/field";
import {
  createNicheAction,
  renameNicheAction,
  toggleNicheAction,
  type NicheState,
} from "./actions";

interface NicheRow {
  id: string;
  slug: string;
  label: string;
  is_active: boolean;
  jobCount: number;
}

function PendingButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : children}
    </Button>
  );
}

export function NicheManager({ niches }: { niches: NicheRow[] }) {
  const [createState, createAction] = useActionState<NicheState, FormData>(
    createNicheAction,
    {},
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <Card className="border-border/70">
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Add a niche
          </h2>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Creators pick from this list, and it&apos;s what the job board filters
            on.
          </p>
          <form action={createAction} className="mt-5 flex flex-col gap-4">
            <Field label="Name" htmlFor="new-niche">
              <Input
                id="new-niche"
                name="label"
                placeholder="Home &amp; garden"
                maxLength={60}
                required
              />
            </Field>

            {createState.error && (
              <p
                role="alert"
                className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
              >
                {createState.error}
              </p>
            )}
            {createState.success && (
              <p
                role="status"
                className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground"
              >
                {createState.success}
              </p>
            )}

            <div className="self-start">
              <PendingButton>
                Add niche
              </PendingButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
          Current niches
        </h2>
        <ul className="flex flex-col gap-3">
          {niches.map((n) => (
            <li key={n.id}>
              <Card className="border-border/70">
                <CardContent>
                  {editingId === n.id ? (
                    <RenameForm
                      niche={n}
                      onDone={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-base font-semibold text-foreground">
                            {n.label}
                          </h3>
                          {!n.is_active && <StatusBadge tone="closed">Archived</StatusBadge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <code>{n.slug}</code> · {n.jobCount}{" "}
                          {n.jobCount === 1 ? "campaign" : "campaigns"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingId(n.id)}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-1 text-sm font-semibold text-primary underline underline-offset-2 transition-colors duration-200 hover:text-primary/80"
                        >
                          <Pencil size={16} />
                          Rename
                        </button>
                        <form action={toggleNicheAction}>
                          <input type="hidden" name="id" value={n.id} />
                          <button
                            type="submit"
                            className="min-h-9 cursor-pointer text-sm font-semibold text-muted-foreground underline underline-offset-2 transition-colors duration-200 hover:text-foreground"
                          >
                            {n.is_active ? "Archive" : "Restore"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Niches are archived rather than deleted, because campaigns and
          creator profiles point at them. Archiving hides one from the pickers
          without breaking anything that already uses it.
        </p>
      </section>
    </div>
  );
}

function RenameForm({
  niche,
  onDone,
}: {
  niche: NicheRow;
  onDone: () => void;
}) {
  const [state, action] = useActionState<NicheState, FormData>(
    renameNicheAction,
    {},
  );

  // Deliberately not auto-closing on success — calling the parent's setState
  // during render cascades, and an effect that does it is the same problem.
  // The list behind this has already revalidated, so "Done" just dismisses.
  if (state.success) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p
          role="status"
          className="text-[15px] font-semibold text-toy-soft-foreground"
        >
          {state.success}
        </p>
        <Button variant="outline" size="sm" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={niche.id} />
      <Field
        label="Name"
        htmlFor={`rename-${niche.id}`}
        hint={`The filter link (${niche.slug}) stays the same.`}
      >
        <Input
          id={`rename-${niche.id}`}
          name="label"
          defaultValue={niche.label}
          maxLength={60}
          required
          autoFocus
        />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <PendingButton>Save</PendingButton>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
