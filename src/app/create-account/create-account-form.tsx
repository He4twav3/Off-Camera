"use client";

import { useActionState } from "react";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAccount, type CreateAccountState } from "./actions";

const initialState: CreateAccountState = {};
const plain =
  "h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50";
const withIcon = `${plain} pl-9`;

const HANDLES = [
  { name: "instagram_handle", label: "Instagram", placeholder: "@yourhandle" },
  { name: "tiktok_handle", label: "TikTok", placeholder: "@yourhandle" },
  { name: "youtube_handle", label: "YouTube", placeholder: "@yourchannel" },
];

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState(createAccount, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">First name</Label>
          <input id="first_name" name="first_name" autoComplete="given-name" required maxLength={60} className={plain} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Surname</Label>
          <input id="last_name" name="last_name" autoComplete="family-name" required maxLength={60} className={plain} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required className={withIcon} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} className={withIcon} />
        </div>
      </div>

      <fieldset className="space-y-3 border-t border-border pt-4">
        <legend className="-mt-[1.45rem] bg-card pr-2 text-xs font-medium text-muted-foreground">
          Your social handles (at least one)
        </legend>
        {HANDLES.map((h) => (
          <div key={h.name} className="space-y-1.5">
            <Label htmlFor={h.name}>{h.label}</Label>
            <input
              id={h.name}
              name={h.name}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={h.placeholder}
              className={plain}
            />
          </div>
        ))}
      </fieldset>

      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="btn-sticker w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
