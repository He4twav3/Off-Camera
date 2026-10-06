import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { hashToken } from "@/lib/secret-box";
import { ConfirmForm } from "./ConfirmForm";

export const metadata: Metadata = { title: "Confirm withdrawal", robots: { index: false, follow: false } };

export default async function ConfirmWithdrawalPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await props.searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/recruiting/earnings/confirm?token=${token}`)}`);
  }

  // Only the creator the request belongs to can see it: the lookup is by their
  // own user id as well as the token.
  let pending: { amount: number; details_last4: string | null; confirm_expires_at: string | null } | null = null;
  if (token.length >= 20 && token.length <= 100) {
    const { data } = await createAdminClient()
      .from("withdrawals")
      .select("amount, details_last4, confirm_expires_at, applicants!inner(user_id)")
      .eq("status", "pending_confirmation")
      .eq("confirm_token_hash", hashToken(token))
      .eq("applicants.user_id", user.id)
      .maybeSingle();
    if (data && data.confirm_expires_at && new Date(data.confirm_expires_at) > new Date()) pending = data;
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Confirm your withdrawal</h1>
      <Card className="mt-6 border-border/70">
        <CardContent className="flex flex-col gap-5">
          {pending ? (
            <>
              <p className="text-[15px] text-foreground">
                Withdraw <strong>{formatCurrency(pending.amount)}</strong> to the account ending{" "}
                <strong>{pending.details_last4 || "…"}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                After you confirm, we wait a safety period (24 to 72 hours) before paying, and you can cancel until then.
                If you didn&apos;t ask for this, don&apos;t confirm. It expires by itself.
              </p>
              <ConfirmForm token={token} />
            </>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              This link is invalid or has expired, or it belongs to a different account.{" "}
              <Link href="/dashboard/recruiting/earnings" className="font-semibold text-primary underline underline-offset-2">
                Go to your earnings
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
