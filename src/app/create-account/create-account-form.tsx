"use client";

import { useActionState } from "react";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAccount, type CreateAccountState } from "./actions";

const initialState: CreateAccountState = {};
const inputClass =
  "h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required className={inputClass} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} className={inputClass} />
        </div>
      </div>
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
