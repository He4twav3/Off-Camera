"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { revealDetailsAction } from "./actions";

/** Details stay out of the page until an admin asks, and every reveal is logged. */
export function RevealDetails({ id, last4 }: { id: string; last4: string | null }) {
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="rounded-md bg-muted/50 p-3">
      <p className="text-sm font-semibold text-muted-foreground">Pay to (Wise: Send money → by email)</p>
      {details ? (
        <>
          <p className="mt-1 break-words whitespace-pre-line text-[15px] text-foreground">{details}</p>
          <button type="button" onClick={() => setDetails(null)} className="mt-2 text-sm font-semibold text-primary underline underline-offset-2">
            Hide
          </button>
        </>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[15px] text-foreground">{last4 ?? "…"}••••</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError(null);
                const r = await revealDetailsAction(id);
                if (r.error) setError(r.error);
                else setDetails(r.details ?? "");
              })
            }
          >
            {pending ? "Decrypting…" : "Show details (logged)"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
