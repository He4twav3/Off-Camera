// TEMPORARY. Never committed.
import { Link2 } from "lucide-react";
import { AccountPreview, handles } from "../_account";
import { SocialAccounts } from "@/components/account/SocialAccounts";

export default async function Page(props: { searchParams: Promise<{ filled?: string }> }) {
  const { filled } = await props.searchParams;
  return (
    <AccountPreview active="accounts" title="Accounts" summary="Link your social media accounts to submit content to campaigns." icon={Link2}>
      <SocialAccounts applicantId="a1" handles={filled ? (handles as never) : []} />
    </AccountPreview>
  );
}
