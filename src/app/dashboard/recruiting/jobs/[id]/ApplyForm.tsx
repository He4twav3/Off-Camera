"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoItem } from "@/components/app/VideosCard";
import { applyToJobAction, type ApplyState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <Send size={20} />
      {pending ? "Applying…" : "Apply"}
    </Button>
  );
}

/** One click: the creator's profile and any videos on it go with the application. */
export function ApplyForm({ jobId, videos }: { jobId: string; videos: VideoItem[] }) {
  const [state, formAction] = useActionState<ApplyState, FormData>(applyToJobAction, {});

  if (state.success) {
    return (
      <div className="rounded-md bg-toy-soft/50 px-5 py-4">
        <p className="font-heading font-semibold text-toy-soft-foreground">Applied</p>
        <p className="mt-1 text-[15px] text-toy-soft-foreground">You&apos;ll be admitted shortly.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="job_id" value={jobId} />
      {videos.slice(0, 5).map((v) => (
        <input key={v.id} type="hidden" name="video_ids" value={v.id} />
      ))}
      {state.error && (
        <p role="alert" className="rounded-sm bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
