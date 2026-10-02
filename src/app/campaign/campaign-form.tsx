"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitCampaignSignup, type CampaignState } from "./actions";

const initialState: CampaignState = {};

const inputClass =
  "h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

const FIELDS = [
  { name: "instagram_handle", label: "Instagram", placeholder: "@yourhandle" },
  { name: "tiktok_handle", label: "TikTok", placeholder: "@yourhandle" },
  { name: "youtube_handle", label: "YouTube", placeholder: "@yourchannel" },
];

export function CampaignForm({
  campaign,
  hashtag,
}: {
  campaign: string;
  hashtag: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitCampaignSignup,
    initialState
  );

  if (state.status === "success") {
    return (
      <p className="text-sm font-medium" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="campaign" value={campaign} />

      <div className="space-y-1.5">
        <Label htmlFor="creator_name">Your name</Label>
        <input
          id="creator_name"
          name="creator_name"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          placeholder="First and last name"
          className={inputClass}
        />
      </div>

      {FIELDS.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <input
            id={f.name}
            name={f.name}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={f.placeholder}
            className={inputClass}
          />
        </div>
      ))}

      {hashtag && (
        <p className="rounded-lg border-2 border-ink bg-card px-3 py-2 text-sm">
          Put <strong>{hashtag}</strong> in the caption of every post you make
          for this campaign. That&apos;s how we find and count them.
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="post_links">Post links (optional)</Label>
        <textarea
          id="post_links"
          name="post_links"
          rows={3}
          autoComplete="off"
          spellCheck={false}
          placeholder={"https://www.tiktok.com/@you/video/…\nOne link per line"}
          className={`${inputClass} h-auto py-2`}
        />
        <p className="text-xs text-muted-foreground">
          Optional. If you paste links we count exactly those posts;
          otherwise we find your posts by the hashtag above.
        </p>
      </div>

      {/* Honeypot — hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs text-muted-foreground">
        Add at least one. A profile link works too.
      </p>

      {state.status === "error" && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Sending…" : "Join the campaign"}
      </Button>
    </form>
  );
}
