"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
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
            placeholder="••••••••"
            required
            minLength={6}
            className="h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={6}
            className="h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
