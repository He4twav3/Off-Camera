"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveSpot, type SaveSpotState } from "@/app/signup/actions";

const initialState: SaveSpotState = {};

/**
 * Passwordless sign-in. Accounts made through /signup never get a password, so
 * the email+password form above can't log them in — this sends the same
 * magic sign-in link /signup sends, to the same address.
 */
export function LoginLinkForm() {
  const [state, formAction, pending] = useActionState(saveSpot, initialState);

  if (state.sent) {
    return (
      <p className="text-sm font-medium" role="status">
        Check your email for a sign-in link.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="link-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="link-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-11 w-full rounded-lg border-2 border-ink bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" variant="outline" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
