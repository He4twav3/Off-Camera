"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { setBrandStatusAction, type BrandAdminState } from "./actions";

function Submit({ children, variant = "default" }: { children: string; variant?: "default" | "outline" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant={variant} disabled={pending}>
      {pending ? "Working…" : children}
    </Button>
  );
}

export function BrandActions({ id, status }: { id: string; status: string }) {
  const [state, formAction] = useActionState<BrandAdminState, FormData>(setBrandStatusAction, {});
  const button = (to: string, label: string, variant?: "default" | "outline" | "destructive") => (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <Submit variant={variant}>{label}</Submit>
    </form>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" && button("approved", "Approve")}
        {status !== "rejected" && button("rejected", "Reject", "destructive")}
        {status === "approved" && button("pending", "Mark pending", "outline")}
      </div>
      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
    </div>
  );
}
