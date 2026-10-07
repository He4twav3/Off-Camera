"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { PLATFORM_LABELS } from "@/lib/utils";
import { MAX_APPLICATION_VIDEOS } from "@/lib/creator-videos";
import type { VideoItem } from "@/components/app/VideosCard";
import { applyToJobAction, type ApplyState } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending || disabled}>
      <Send size={20} />
      {pending ? "Sending…" : "Send application"}
    </Button>
  );
}

export function ApplyForm({
  jobId,
  videos,
  sampleRequired = false,
  sampleCriteria = null,
}: {
  jobId: string;
  videos: VideoItem[];
  sampleRequired?: boolean;
  sampleCriteria?: string | null;
}) {
  const [open, setOpen] = useState(false);
  // The most recent few are ticked to start with; the creator can change them.
  const [picked, setPicked] = useState<string[]>(() => videos.slice(0, 3).map((v) => v.id));
  const [state, formAction] = useActionState<ApplyState, FormData>(applyToJobAction, {});

  if (state.success) {
    return (
      <div className="rounded-md bg-toy-soft/50 px-5 py-4">
        <p className="font-heading font-semibold text-toy-soft-foreground">Application sent</p>
        <p className="mt-1 text-[15px] text-toy-soft-foreground">
          We&apos;ll look at your profile and the videos you picked and get back to you. You can track it from your{" "}
          <Link href="/dashboard/recruiting" className="font-semibold underline">
            dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  // Videos are what an application is made of, so there has to be at least one.
  if (videos.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 bg-muted/40 p-5">
        <p className="font-heading font-semibold text-foreground">Add a video to apply</p>
        <p className="mt-1 text-[15px] text-muted-foreground">
          You apply with videos from your profile. Add at least one of your own videos first, then come back.
        </p>
        <Button className="mt-4" nativeButton={false} render={<Link href="/dashboard/recruiting#videos" />}>
          Add videos to my profile
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={() => setOpen(true)}>
          <Send size={20} />
          Apply with my videos
        </Button>
        <p className="text-sm text-muted-foreground">
          {sampleRequired
            ? "You choose which of your videos to apply with, and add a short sample video (a Google Drive link) because this brand asks for one."
            : "You choose which of your videos to apply with. Your profile is sent with them."}
        </p>
      </div>
    );
  }

  const atLimit = picked.length >= MAX_APPLICATION_VIDEOS;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="job_id" value={jobId} />

      <fieldset className="flex flex-col gap-3">
        <legend className="font-heading text-base font-semibold text-foreground">Apply with these videos</legend>
        <p className="text-sm text-muted-foreground">
          Pick up to {MAX_APPLICATION_VIDEOS}. <span className="font-semibold text-foreground">{picked.length}</span> chosen.{" "}
          <Link href="/dashboard/recruiting#videos" className="font-semibold text-primary underline underline-offset-2">
            Add or change videos
          </Link>
        </p>
        <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
          {videos.map((v) => {
            const checked = picked.includes(v.id);
            return (
              <li key={v.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${!checked && atLimit ? "cursor-not-allowed opacity-50" : "hover:bg-muted/30"}`}
                >
                  <input
                    type="checkbox"
                    name="video_ids"
                    value={v.id}
                    checked={checked}
                    disabled={!checked && atLimit}
                    onChange={(e) => setPicked((cur) => (e.target.checked ? [...cur, v.id] : cur.filter((id) => id !== v.id)))}
                    className="size-4 shrink-0 accent-[var(--color-primary)]"
                  />
                  <span className="w-24 shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-center text-xs font-semibold text-muted-foreground">
                    {PLATFORM_LABELS[v.platform]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-foreground" title={v.url}>
                    {v.title || v.url}
                  </span>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-sm font-semibold text-primary underline underline-offset-2"
                  >
                    Watch
                  </a>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {sampleRequired && (
        <div className="rounded-lg border border-border/70 bg-muted/40 p-4">
          <p className="font-heading font-semibold text-foreground">This brand also wants a sample video</p>
          {sampleCriteria && (
            <p className="mt-1 whitespace-pre-line text-[15px] text-muted-foreground">{sampleCriteria}</p>
          )}
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Upload your video to Google Drive.</li>
            <li>
              Click Share and set access to <strong>Anyone with the link</strong> (viewer). If it is private, the brand
              can&apos;t watch it.
            </li>
            <li>Copy the link and paste it below.</li>
          </ol>
          <div className="mt-4">
            <Field label="Sample video link" htmlFor="sample_url">
              <Input
                id="sample_url"
                name="sample_url"
                type="url"
                inputMode="url"
                autoComplete="off"
                required
                maxLength={500}
                placeholder="https://drive.google.com/file/d/…"
              />
            </Field>
          </div>
        </div>
      )}

      <Field label="Anything you want to add?" htmlFor="cover_note" hint="Optional. A line or two on why this one suits you.">
        <Textarea
          id="cover_note"
          name="cover_note"
          maxLength={1000}
          placeholder="I've made a few videos in this space and my audience skews right for it…"
        />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitButton disabled={picked.length === 0} />
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
