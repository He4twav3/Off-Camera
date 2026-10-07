import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Link2 } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { Notice } from "@/components/kit/ui";
import { SocialAccounts } from "@/components/account/SocialAccounts";
import { loadAccount } from "@/lib/account";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage(props: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await props.searchParams;
  const { supabase, applicant, person } = await loadAccount(
    "/dashboard/account/accounts",
  );
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  const { data: handles } = await supabase
    .from("applicant_handles")
    .select("*")
    .eq("applicant_id", applicant.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <AccountShell
      active="accounts"
      person={person}
      title="Accounts"
      summary="Link your social media accounts to submit content to campaigns."
      icon={Link2}
    >
      {welcome && (
        <Notice>
          Profile saved. Now connect the account you post from: you need one to
          join a campaign.
        </Notice>
      )}
      <SocialAccounts applicantId={applicant.id} handles={handles ?? []} />
    </AccountShell>
  );
}
