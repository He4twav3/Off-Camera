import type { Metadata } from "next";
import { requireAdminMfa } from "@/lib/admin-mfa";
import { createClient } from "@/lib/supabase/server";
import { adminGuard } from "@/lib/admin-guard";
import { loadCleanup } from "@/lib/admin-cleanup";
import { CleanupForm } from "./CleanupForm";

export const metadata: Metadata = { title: "Clean up · Admin" };

export default async function AdminCleanupPage() {
  await requireAdminMfa("/admin/cleanup");
  const blocked = await adminGuard();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Clean up</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Clear out test and placeholder accounts and campaigns. Admins and Getimg are kept, and so is anyone on Getimg&apos;s campaign unless you tick them.
      </p>
      {blocked || !user ? (
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{blocked ?? "Sign in first."}</p>
      ) : (
        <Loaded userId={user.id} />
      )}
    </div>
  );
}

async function Loaded({ userId }: { userId: string }) {
  const { accounts, campaigns } = await loadCleanup(userId);
  return <CleanupForm accounts={accounts} campaigns={campaigns} />;
}
