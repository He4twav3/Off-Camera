"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleX } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * The landing page for links from supabase.auth.admin.generateLink()
 * (see lib/fulfillment.ts's claim link, api/checkout/dodo/confirm's
 * magic link) — NOT the same thing as /auth/callback.
 *
 * admin.generateLink() can never produce a PKCE `?code=` link the way
 * a real client-initiated signUp()/resetPasswordForEmail() call does —
 * PKCE requires a code_verifier that only exists on a browser that
 * already started the flow, which an out-of-band admin-generated link
 * inherently doesn't have. It always hands back tokens in the URL hash
 * fragment instead (implicit grant) — fragments never reach a server,
 * so this has to be a client component that reads window.location.hash
 * itself and calls setSession() directly, rather than a route handler.
 */
export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthConfirmShell />}>
      <AuthConfirmInner />
    </Suspense>
  );
}

/** Static wrapper shared by both the Suspense fallback and the real
 * (error/loading) states, so there's no layout flash between them. */
function AuthConfirmShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 text-center sm:p-8">
        {children ?? <p className="text-sm text-muted-foreground">Signing you in…</p>}
      </div>
    </div>
  );
}

function AuthConfirmInner() {
  const router = useRouter();
  // useSearchParams() requires a Suspense boundary for static
  // prerendering — that's what AuthConfirmPage's wrapper is for.
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Everything (including the "is this link even well-formed" checks)
    // runs from inside this async function's own microtask, not
    // synchronously in the effect body itself — same pattern as
    // stripe-card-panel.tsx used earlier for the same lint rule.
    async function establishSession(): Promise<
      { ok: true; next: string } | { ok: false; error: string }
    > {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);

      const hashError = params.get("error_description") ?? params.get("error");
      if (hashError) return { ok: false, error: hashError };

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        return { ok: false, error: "This link is invalid or has expired." };
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) return { ok: false, error: "This link is invalid or has expired." };
      return { ok: true, next: searchParams.get("next") ?? "/dashboard" };
    }

    establishSession().then((result) => {
      if (result.ok) router.replace(result.next);
      else setError(result.error);
    });
  }, [router, searchParams]);

  if (!error) return <AuthConfirmShell />;

  return (
    <AuthConfirmShell>
      <CircleX className="mx-auto size-10 text-destructive" />
      <h1 className="mt-3 text-xl font-semibold tracking-tight">This link didn&apos;t work</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
      <Button className="btn-sticker mt-6 w-full" nativeButton={false} render={<Link href="/login" />}>
        Sign in
      </Button>
    </AuthConfirmShell>
  );
}
