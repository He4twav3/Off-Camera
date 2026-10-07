"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** The verification code, with a button to copy it. */
export function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 font-mono text-sm font-semibold tracking-wide text-foreground">
      <span className="select-all">{code}</span>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard blocked: the code is selectable right next to the button.
          }
        }}
        className="cursor-pointer text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </span>
  );
}
