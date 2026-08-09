"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeToUpdates, type NewsletterState } from "@/app/actions/leads";

const initialState: NewsletterState = {};

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToUpdates, initialState);

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <Check className="size-4" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-xs">
      <p className="text-sm font-semibold">Get notified about updates</p>
      <div className="relative mt-2">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="h-10 w-full rounded-full border-2 border-ink bg-card pr-10 pl-3.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          <ArrowRight className="size-3.5" />
        </button>
      </div>
      {state.status === "error" && (
        <p className="mt-1.5 text-xs font-medium text-destructive">{state.message}</p>
      )}
    </form>
  );
}
