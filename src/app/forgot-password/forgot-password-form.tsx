"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Info, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

function DevLinkNotice({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Couldn&apos;t actually deliver that email (no provider
          configured, or it was rejected), so here&apos;s the reset link
          directly instead of &ldquo;check your email&rdquo;.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-card px-2.5 py-2">
        <code className="min-w-0 flex-1 truncate text-foreground">{link}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded p-1 hover:bg-secondary"
          aria-label="Copy reset link"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <Link href={link} className="font-medium text-foreground underline underline-offset-2">
        Open the reset link
      </Link>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestReset, initialState);

  if (state.submitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          {state.devLink
            ? "Found an account for that email — here's your reset link:"
            : "If an account exists for that email, a reset link has been sent."}
        </p>
        {state.devLink && <DevLinkNotice link={state.devLink} />}
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-foreground underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

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

      {state.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <Link
        href="/login"
        className="block text-center text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Back to sign in
      </Link>
    </form>
  );
}
