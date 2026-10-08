"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/account/AccountShell";
import {
  removeAvatarAction,
  uploadAvatarAction,
  type AccountState,
} from "@/app/dashboard/account/actions";

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending || disabled}
    >
      <Upload size={16} />
      {pending ? "Uploading…" : "Upload"}
    </Button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      <Trash2 size={14} />
      {pending ? "Removing…" : "Remove picture"}
    </Button>
  );
}

/** "Profile Picture": a drop box, an Upload button, and the current picture with a way to remove it. */
export function PictureField({
  name,
  url,
  canUpload,
}: {
  name: string;
  url: string | null;
  canUpload: boolean;
}) {
  const [state, upload] = useActionState<AccountState, FormData>(
    uploadAvatarAction,
    {},
  );
  const [removed, remove] = useActionState<AccountState, FormData>(
    removeAvatarAction,
    {},
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="text-[15px] font-semibold text-foreground">
        Profile Picture
      </p>

      {!canUpload ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Save your profile first, then you can add a picture.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-start gap-5">
          <Avatar name={name} url={url} size={72} />
          <form action={upload} className="w-full max-w-sm flex-1 basis-72">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f && input.current) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  input.current.files = dt.files;
                  setPicked(f.name);
                }
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${over ? "border-primary bg-primary/5" : "border-border"}`}
            >
              {/* A real button that opens the file picker itself, so it works in every browser. */}
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Upload className="size-6" />
                <span>{picked ?? "Click to upload or drag and drop"}</span>
                <span className="text-xs">
                  Supported files: .jpg, .png, .gif, .webp
                </span>
              </button>
              <input
                ref={input}
                id="avatar-file"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={(e) => setPicked(e.target.files?.[0]?.name ?? null)}
              />
              <div className="mt-4">
                <UploadButton disabled={!picked} />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a picture to personalise your account (max 2MB)
            </p>
            {state.error && (
              <p
                role="alert"
                className="mt-2 text-sm font-semibold text-destructive"
              >
                {state.error}
              </p>
            )}
            {state.success && (
              <p className="mt-2 text-sm font-semibold text-toy-soft-foreground">
                {state.success}
              </p>
            )}
          </form>
          {url && (
            <form action={remove}>
              <RemoveButton />
              {removed.error && (
                <p className="mt-2 text-sm font-semibold text-destructive">
                  {removed.error}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
