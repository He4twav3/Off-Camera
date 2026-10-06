"use client";

import { useActionState } from "react";
import { Mail, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createTeamAccount, type TeamState } from "./actions";

const initialState: TeamState = {};
const plain =
  "h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50";
const withIcon = `${plain} pl-9`;

export function TeamSignupForm() {
  const [state, formAction, pending] = useActionState(createTeamAccount, initialState);

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <div className="space-y-1.5">
        <Label htmlFor="key">Team access key</Label>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="key" name="key" type="password" autoComplete="off" required maxLength={200} className={withIcon} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Your email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={200} className={withIcon} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 12 characters"
            required
            minLength={12}
            maxLength={128}
            className={withIcon}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          12+ characters, with at least three of: lowercase, UPPERCASE, numbers, symbols. A password manager is best.
        </p>
      </div>

      {state.error && <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="btn-sticker h-11 w-full">
        {pending ? "Checking…" : "Create team account"}
      </Button>
    </form>
  );
}
