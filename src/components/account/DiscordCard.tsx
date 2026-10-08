"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, MessagesSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/account/AccountShell";
import {
  disconnectDiscordAction,
  type AccountState,
} from "@/app/dashboard/account/actions";

const MESSAGES: Record<string, { text: string; good?: boolean }> = {
  connected: { text: "Discord connected.", good: true },
  cancelled: { text: "You cancelled on Discord, so nothing was connected." },
  failed: { text: "We couldn't connect Discord. Please try again." },
  taken: {
    text: "That Discord account is already connected to another creator.",
  },
  unavailable: { text: "Connecting Discord isn't switched on yet." },
  "profile-first": { text: "Save your profile first, then connect Discord." },
};

function Disconnect() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="text-destructive"
      disabled={pending}
    >
      <Trash2 size={16} />
      {pending ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}

/**
 * "Discord Connection": the creator signs in with Discord and Discord tells us who they
 * are. The name shown here is the one Discord gave us, never one the creator typed.
 */
export function DiscordCard({
  username,
  status,
}: {
  username: string | null;
  status?: string;
}) {
  const [gone, disconnect] = useActionState<AccountState, FormData>(
    disconnectDiscordAction,
    {},
  );
  const message = status ? MESSAGES[status] : undefined;

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
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-3 py-1 text-sm font-medium text-foreground">
            <CheckCircle2 className="size-4 text-toy-soft-foreground" />
            Connected
          </span>
        ) : undefined
      }
    >
      {message && (
        <p
          role={message.good ? "status" : "alert"}
          className={`rounded-md px-3 py-2 text-sm font-medium ${message.good ? "bg-muted text-foreground" : "bg-destructive/10 text-destructive"}`}
        >
          {message.text}
        </p>
      )}

      {username ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#5865F2] text-white">
              <MessagesSquare className="size-6" />
            </span>
            <p className="text-lg font-semibold text-foreground">{username}</p>
          </div>
          <form action={disconnect}>
            <Disconnect />
          </form>
          {gone.error && (
            <p className="w-full text-sm font-semibold text-destructive">
              {gone.error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Sign in with Discord to connect your account. We only see your
            Discord name.
          </p>
          {/* A plain link, not a client-side one: it has to leave the site and come back. */}
          <Button
            nativeButton={false}
            render={<a href="/api/discord/connect" />}
          >
            <MessagesSquare size={16} />
            Connect Discord
          </Button>
        </div>
      )}
    </Section>
  );
}
