"use client";

import { useActionState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeToUpdates, type NewsletterState } from "@/app/actions/leads";

const initialState: NewsletterState = {};

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeToUpdates, initialState);

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
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
          className="h-10 w-full rounded-full border border-hairline bg-surface-1 pr-10 pl-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-hairline-strong focus-visible:ring-2 focus-visible:ring-white/20"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-crimson-bright to-crimson text-cta-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
