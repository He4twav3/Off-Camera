"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resendCode, verifyAccount, type VerifyState } from "./actions";

const initial: VerifyState = {};

export function VerifyForm({ email }: { email: string }) {
  const [state, verifyAction, verifying] = useActionState(verifyAccount, initial);
  const [resent, resendAction, resending] = useActionState(resendCode, initial);

  return (
    <div className="space-y-4">
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-1.5">
          <Label htmlFor="code">6-digit code</Label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            required
            autoFocus
            placeholder="000000"
            className="h-12 w-full rounded-lg border-2 border-ink bg-card text-center font-mono text-2xl tracking-[0.35em] outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
        <Button type="submit" size="lg" disabled={verifying} className="btn-sticker w-full">
          {verifying ? "Checking…" : "Verify"}
        </Button>
      </form>

      <form action={resendAction} className="text-center">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resending}
          className="text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {resending ? "Sending…" : "Send a new code"}
        </button>
        {(resent.message || resent.error) && (
          <p className={`mt-2 text-sm ${resent.error ? "text-destructive" : "text-muted-foreground"}`}>
            {resent.error ?? resent.message}
          </p>
        )}
      </form>
    </div>
  );
}
