"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";

type Props = { level: string; factorId: string | null; next: string };

export function MfaPanel({ level, factorId, next }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);

  const supabase = createClient();

  async function verify(id: string) {
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code: code.trim() });
    setBusy(false);
    if (e) {
      setError("That code didn't work. Check the code in your app and try again.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function startEnroll() {
    setBusy(true);
    setError(null);
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "OnCamera admin" });
    setBusy(false);
    if (e || !data) {
      setError("Couldn't start setup. Is two-step sign-in (TOTP) enabled in your Supabase Auth settings?");
      return;
    }
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  if (level === "aal2") {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-sm bg-toy-soft/50 px-4 py-3 text-sm font-semibold text-toy-soft-foreground">
          Two-step sign-in is on for this session. You can use Payouts and Withdrawals.
        </p>
        <Button type="button" onClick={() => router.push(next)}>
          Continue
        </Button>
      </div>
    );
  }

  // Has an authenticator app set up: just enter today's code.
  if (factorId) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void verify(factorId);
        }}
      >
        <Field label="Code from your authenticator app" htmlFor="mfa-code" hint="Six digits. It changes every 30 seconds.">
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </Field>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <div>
          <Button type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Verify"}
          </Button>
        </div>
      </form>
    );
  }

  // First time: scan a QR code, then prove it works with a code.
  if (enrolling) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void verify(enrolling.id);
        }}
      >
        <p className="text-[15px] text-foreground">
          1. Open your authenticator app and scan this code.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrolling.qr} alt="QR code to add this account to your authenticator app" className="size-48 rounded-md bg-white p-2" />
        <p className="text-sm text-muted-foreground">
          Can&apos;t scan? Enter this key in the app instead:{" "}
          <span className="font-mono break-all text-foreground">{enrolling.secret}</span>
        </p>
        <Field label="2. Enter the six-digit code the app shows" htmlFor="mfa-code">
          <Input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />
        </Field>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <div>
          <Button type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Turn on two-step sign-in"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] text-foreground">You haven&apos;t set up two-step sign-in yet.</p>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <div>
        <Button type="button" onClick={() => void startEnroll()} disabled={busy}>
          {busy ? "Starting…" : "Set it up"}
        </Button>
      </div>
    </div>
  );
}
