"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, MessagesSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Section } from "@/components/account/AccountShell";
import {
  disconnectDiscordAction,
  saveDiscordAction,
  type AccountState,
} from "@/app/dashboard/account/actions";

function Submit({
  children,
  pending: label,
}: {
  children: React.ReactNode;
  pending: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? label : children}
    </Button>
  );
}

/** "Discord Connection": a username, so brands and we can find you there. Typed in, not linked. */
export function DiscordCard({ username }: { username: string | null }) {
  const [saved, save] = useActionState<AccountState, FormData>(
    saveDiscordAction,
    {},
  );
  const [gone, disconnect] = useActionState<AccountState, FormData>(
    disconnectDiscordAction,
    {},
  );

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <MessagesSquare className="size-5 text-[#5865F2]" />
          Discord Connection
        </span>
      }
      aside={
        username ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-sm font-medium text-foreground">
            <CheckCircle2 className="size-4 text-toy-soft-foreground" />
            Connected
          </span>
        ) : undefined
      }
    >
      {username ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#5865F2] text-white">
              <MessagesSquare className="size-6" />
            </span>
            <p className="text-lg font-semibold text-foreground">{username}</p>
          </div>
          <form action={disconnect}>
            <Button
              type="submit"
              variant="outline"
              className="text-destructive"
            >
              <Trash2 size={16} />
              Disconnect
            </Button>
          </form>
          {gone.error && (
            <p className="w-full text-sm font-semibold text-destructive">
              {gone.error}
            </p>
          )}
        </div>
      ) : (
        <form action={save} className="flex flex-col gap-3">
          <Field
            label="Discord username"
            htmlFor="discord"
            hint="So brands and our team can reach you. We never post as you."
          >
            <Input
              id="discord"
              name="discord"
              placeholder="yourname"
              maxLength={33}
              autoComplete="off"
              required
            />
          </Field>
          {saved.error && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {saved.error}
            </p>
          )}
          <div className="self-start">
            <Submit pending="Saving…">Connect</Submit>
          </div>
        </form>
      )}
    </Section>
  );
}
