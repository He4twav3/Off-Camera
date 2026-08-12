"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction, type ResendVerificationState } from "@/app/dashboard/actions";

const initialState: ResendVerificationState = {};

export function ResendVerificationButton() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initialState);
  const [copied, setCopied] = useState(false);

  if (state.sent && state.devLink) {
    const link = state.devLink;
    return (
      <div className="space-y-2 text-sm">
        <p>No real email provider connected in this demo — here&apos;s the link directly:</p>
        <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-background px-2.5 py-2 text-xs">
          <code className="min-w-0 flex-1 truncate">{link}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="shrink-0 rounded p-1 hover:bg-secondary"
            aria-label="Copy verification link"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
        <Link href={link} className="font-medium text-foreground underline underline-offset-2">
          Open the verification link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
    </form>
  );
}
