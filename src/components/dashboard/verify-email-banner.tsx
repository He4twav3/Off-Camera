import { MailWarning } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { ResendVerificationButton } from "@/components/dashboard/resend-verification-button";

/**
 * Shown on both /dashboard (the very first thing a fresh signup lands on)
 * and /dashboard/account — not account-only. A brand new account is
 * unverified by definition, and there was previously nowhere on the page
 * someone actually lands on after signing up that said so; the only way
 * to discover it existed was to already know to visit /dashboard/account
 * and click "resend." Surfacing it here too means the very first screen
 * after signup tells you outright, instead of silently doing nothing.
 */
export async function VerifyEmailBanner() {
  const session = await getSession();
  if (!session || session.emailVerified) return null;

  return (
    <Card className="border-2 border-ink bg-toy-soft">
      <CardContent className="flex items-start gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-toy-soft-foreground" />
        <div className="flex-1 space-y-2">
          <div>
            <h2 className="text-sm font-semibold text-toy-soft-foreground">
              Verify your email
            </h2>
            <p className="mt-1 text-sm text-toy-soft-foreground/80">
              {session.email} hasn&apos;t been confirmed yet.
            </p>
          </div>
          <ResendVerificationButton />
        </div>
      </CardContent>
    </Card>
  );
}
