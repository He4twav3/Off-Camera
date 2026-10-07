"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PLATFORM_LABELS } from "@/lib/utils";
import { MAX_PROFILE_VIDEOS } from "@/lib/creator-videos";
import { addVideoAction, removeVideoAction, type VideoState } from "@/app/dashboard/recruiting/videos-actions";
import type { PlatformEnum } from "@/lib/database.types";

export type VideoItem = { id: string; platform: PlatformEnum; url: string; title: string | null };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus size={16} />
      {pending ? "Adding…" : "Add video"}
    </Button>
  );
}

/** "Your videos": the links a creator applies with. Add by pasting a post link. */
export function VideosCard({ videos }: { videos: VideoItem[] }) {
  const [state, formAction] = useActionState<VideoState, FormData>(async (prev, formData) => {
    const result = await addVideoAction(prev, formData);
    if (result.success) formRef.current?.reset();
    return result;
  }, {});
  const formRef = useRef<HTMLFormElement>(null);
  const full = videos.length >= MAX_PROFILE_VIDEOS;

  return (
    <section id="videos" className="scroll-mt-20 rounded-xl border border-border/70 bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Your videos</h2>
        <p className="text-sm text-muted-foreground">
          {videos.length} of {MAX_PROFILE_VIDEOS}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Link your best videos here. When you apply to a campaign you choose which of them to apply with.
      </p>

      {videos.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          No videos yet. Add at least one so you can apply.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border/70 rounded-lg border border-border/70">
          {videos.map((v) => (
            <li key={v.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-24 shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-center text-xs font-semibold text-muted-foreground">
                {PLATFORM_LABELS[v.platform]}
              </span>
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground underline-offset-2 hover:underline"
                title={v.url}
              >
                {v.title || v.url}
              </a>
              <form action={removeVideoAction}>
                <input type="hidden" name="id" value={v.id} />
                <button
                  type="submit"
                  aria-label="Remove this video"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <p className="mt-4 text-sm text-muted-foreground">You&apos;ve reached the limit. Remove one to add another.</p>
      ) : (
        <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
            <Field label="Link to a video" htmlFor="video_url" hint="A post on TikTok, Instagram, YouTube or X.">
              <Input id="video_url" name="url" type="url" inputMode="url" autoComplete="off" required maxLength={600} placeholder="https://www.tiktok.com/@you/video/…" />
            </Field>
            <Field label="Title (optional)" htmlFor="video_title">
              <Input id="video_title" name="title" maxLength={80} placeholder="e.g. Skincare routine" />
            </Field>
          </div>
          {state.error && (
            <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {state.error}
            </p>
          )}
          <div>
            <AddButton />
          </div>
        </form>
      )}
    </section>
  );
}
