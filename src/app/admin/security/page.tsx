import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { MfaPanel } from "./MfaPanel";

export const metadata: Metadata = { title: "Security · Admin" };

export default async function AdminSecurityPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await props.searchParams;
  // Only ever send people back to another admin page.
  const back = next && next.startsWith("/admin/") && !next.startsWith("//") ? next : "/admin/withdrawals";

  const supabase = await createClient();
  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  const verified = (factors?.totp ?? []).find((f) => f.status === "verified") ?? null;

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Two-step sign-in</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Admin pages show creators&apos; personal details and move real money, so they need a six-digit code from an
        authenticator app (Google Authenticator, 1Password, Authy…) on top of your password. This page is the
        only admin page that works without it, so you can set it up or enter your code.
      </p>

      <Card className="mt-6 border-border/70">
        <CardContent>
          <MfaPanel
            level={aal?.currentLevel ?? "aal1"}
            factorId={verified?.id ?? null}
            next={back}
          />
        </CardContent>
      </Card>
    </div>
  );
}
