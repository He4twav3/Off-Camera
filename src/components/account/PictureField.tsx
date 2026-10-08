"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/account/AccountShell";
import {
  removeAvatarAction,
  uploadAvatarAction,
  type AccountState,
} from "@/app/dashboard/account/actions";

function UploadStatus() {
  const { pending } = useFormStatus();
  return pending ? (
    <p className="mt-3 text-sm font-semibold text-foreground">Uploading…</p>
  ) : null;
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
                  input.current.form?.requestSubmit();
                }
              }}
              className={`rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${over ? "border-primary bg-primary/5" : "border-border"}`}
            >
              {/* A plain file field, always clickable. The picture uploads as soon as one is chosen. */}
              <p className="mb-3 text-xs text-muted-foreground">
                Choose a picture, or drop one here. It uploads straight away.
                Supported files: .jpg, .png, .gif, .webp
              </p>
              <input
                ref={input}
                id="avatar-file"
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                aria-label="Choose a profile picture"
                className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) e.target.form?.requestSubmit();
                }}
              />
              <UploadStatus />
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
