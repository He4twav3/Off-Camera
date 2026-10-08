"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { setCampaignStatusAction, type BrandPayState } from "./actions";

/** Close a campaign to new creators, or open it again. Creators already on it keep working. */
export function CampaignStatusButton({ jobId, status }: { jobId: string; status: "open" | "filled" | "closed" }) {
  const [state, action, pending] = useActionState<BrandPayState, FormData>(setCampaignStatusAction, {});
  const isOpen = state.success ? state.success.startsWith("Campaign reopened") : status === "open";
  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="status" value={isOpen ? "closed" : "open"} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : isOpen ? "Close campaign" : "Reopen campaign"}
      </Button>
      {state.error && <p className="text-xs font-semibold text-destructive">{state.error}</p>}
    </form>
  );
}
