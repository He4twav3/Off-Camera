"use client";

import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveSpot, type SaveSpotState } from "./actions";

const initialState: SaveSpotState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(saveSpot, initialState);

  if (state.sent) {
    return (
      <div className="mt-4 rounded-lg border-2 border-ink bg-card p-5 text-left">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Mail className="size-4 shrink-0 text-primary" />
          Check your email
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent you a sign-in link. Open it on this device to get
          straight into the course.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3" aria-label="Save your spot">
      <label className="sr-only" htmlFor="signup-email">
        Email address
      </label>
      <input
        id="signup-email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="h-11 w-full rounded-lg border-2 border-ink bg-card px-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Saving your spot…" : "Save your spot"}
        {!pending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  );
}
