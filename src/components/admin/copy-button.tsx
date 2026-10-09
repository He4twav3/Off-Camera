"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a value (an email, a payment link) to the clipboard. */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
      className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
      aria-label={`${label} ${value}`}
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
      {done ? "Copied" : label}
    </button>
  );
}
