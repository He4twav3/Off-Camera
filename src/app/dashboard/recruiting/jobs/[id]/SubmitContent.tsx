"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofForm } from "@/app/dashboard/recruiting/ProofForm";
import type { PostPlatform } from "@/lib/post-link";

/** "Submit content": a button that opens a small window to paste the link to your post. */
export function SubmitContent({
  assignmentId,
  platform,
  currentProofUrl,
  label = "Submit content",
}: {
  assignmentId: string;
  platform: PostPlatform;
  currentProofUrl: string | null;
  label?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        size="lg"
        className="w-full"
        onClick={() => ref.current?.showModal()}
      >
        <Upload size={18} />
        {label}
      </Button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-full max-w-md rounded-xl border border-border bg-card p-0 text-foreground backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">Submit content</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-5">
          <ProofForm
            assignmentId={assignmentId}
            currentProofUrl={currentProofUrl}
            platform={platform}
          />
        </div>
      </dialog>
    </>
  );
}
