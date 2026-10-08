"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { setCampaignLogoAction, type BrandLogoState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/** A brand's own logo for one of its campaigns: shown on the campaign card creators see. */
export function CampaignLogoForm({
  jobId,
  logoUrl,
}: {
  jobId: string;
  logoUrl: string | null;
}) {
  const [state, formAction] = useActionState<BrandLogoState, FormData>(
    setCampaignLogoAction,
    {},
  );
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/70 bg-muted/30 p-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="max-h-full max-w-full object-contain p-1.5"
          />
        ) : (
          <span className="text-xs text-muted-foreground">No logo</span>
        )}
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <p className="text-[15px] font-semibold text-foreground">
          Campaign logo
        </p>
        <p className="text-sm text-muted-foreground">
          Shown to creators on your campaign card. JPG, PNG or WebP, up to 2 MB.
        </p>
      </div>
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="job_id" value={jobId} />
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Choose a logo"
          className="max-w-52 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
        />
        <Submit label={logoUrl ? "Replace" : "Upload"} />
      </form>
      {logoUrl && (
        <form action={formAction}>
          <input type="hidden" name="job_id" value={jobId} />
          <input type="hidden" name="remove" value="on" />
          <Button type="submit" size="sm" variant="outline">
            Remove
          </Button>
        </form>
      )}
      {state.error && (
        <p
          role="alert"
          className="w-full text-sm font-semibold text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="w-full text-sm font-semibold text-foreground"
        >
          {state.success}
        </p>
      )}
    </div>
  );
}
