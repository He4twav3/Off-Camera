"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createAccount, type CreateAccountState } from "./actions";

const initialState: CreateAccountState = {};
const plain =
  "h-11 w-full rounded-lg border-2 border-ink bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50";
const withIcon = `${plain} pl-9`;

export function CreateAccountForm({ accountType }: { accountType: "creator" | "brand" }) {
  const [state, formAction, pending] = useActionState(createAccount, initialState);
  const isBrand = accountType === "brand";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="account_type" value={accountType} />

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

      {isBrand && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company name</Label>
            <input id="company_name" name="company_name" autoComplete="organization" required maxLength={120} className={plain} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website (optional)</Label>
            <input id="website" name="website" inputMode="url" autoComplete="url" placeholder="yourbrand.com" maxLength={200} className={plain} />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">{isBrand ? "Work email" : "Email"}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="email" name="email" type="email" autoComplete="email" placeholder={isBrand ? "you@yourbrand.com" : "you@example.com"} required className={withIcon} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} className={withIcon} />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 accent-[#ac0216]" />
        <span>
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="font-medium text-foreground underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="btn-sticker h-11 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
