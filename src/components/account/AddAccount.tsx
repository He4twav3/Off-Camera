"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  addAccountAction,
  removeAccountAction,
  type AccountState,
} from "@/app/dashboard/account/actions";
import { PlatformIcon } from "@/components/account/PlatformIcons";

// The three platforms creators are paid on. (X isn't offered: nothing is tracked there.)
const BUTTONS = [
  { platform: "youtube_shorts", label: "YouTube" },
  { platform: "instagram", label: "Instagram" },
  { platform: "tiktok", label: "TikTok" },
] as const;

function AddSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Add account"}
    </Button>
  );
}

/** One button per platform; pressing one opens a box for your username on it. */
export function AddAccount() {
  const [open, setOpen] = useState<(typeof BUTTONS)[number] | null>(null);
  const [state, action] = useActionState<AccountState, FormData>(
    async (prev, formData) => {
      const result = await addAccountAction(prev, formData);
      if (result.success) setOpen(null);
      return result;
    },
    {},
  );

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap justify-end gap-2">
        {BUTTONS.map((b) => (
          <Button
            key={b.platform}
            type="button"
            variant={open?.platform === b.platform ? "default" : "outline"}
            size="sm"
            onClick={() => setOpen(b)}
          >
            <PlatformIcon platform={b.platform} className="size-4" />
            {b.label}
            <Plus size={14} />
          </Button>
        ))}
      </div>
      {open && (
        <form
          action={action}
          className="flex w-full flex-wrap items-center justify-end gap-2"
        >
          <input type="hidden" name="platform" value={open.platform} />
          <Input
            name="handle"
            autoFocus
            required
            placeholder={open.platform === "youtube_shorts" ? "@yourchannel" : `Your ${open.label} handle`}
            className="min-w-56 flex-1 sm:max-w-xs"
            aria-label={`Your ${open.label} username`}
          />
          <AddSubmit />
          <Button type="button" variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
        </form>
      )}
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm font-semibold text-toy-soft-foreground">
          {state.success}
        </p>
      )}
    </div>
  );
}

export function RemoveAccount({ id }: { id: string }) {
  const [state, action] = useActionState<AccountState, FormData>(
    removeAccountAction,
    {},
  );
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-destructive hover:opacity-80"
      >
        <Trash2 size={14} />
        Remove
      </button>
      {state.error && (
        <p className="mt-1 text-xs font-semibold text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
