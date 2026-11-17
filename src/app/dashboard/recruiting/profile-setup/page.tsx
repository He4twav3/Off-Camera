import type { Metadata } from "next";
import { User } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { DiscordCard } from "@/components/account/DiscordCard";
import { loadAccount } from "@/lib/account";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage(props: {
  searchParams: Promise<{ discord?: string }>;
}) {
  const { discord } = await props.searchParams;
  const { applicant, session, person } = await loadAccount(
    "/dashboard/recruiting/profile-setup",
  );

  return (
    <AccountShell
      active="profile"
      person={person}
      title="Profile"
      summary="Manage your personal information and account settings."
      icon={User}
    >
      {!applicant && (
        <p className="mb-6 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground">
          Save your profile first. Accounts, Videos, Payments, Affiliates and Submissions open as
          soon as it&apos;s saved.
        </p>
      )}
      <ProfileForm
        existing={applicant ?? null}
        defaultName={session?.displayName ?? ""}
      />
      {applicant && (
        <DiscordCard username={applicant.discord_username} status={discord} />
      )}
    </AccountShell>
  );
}
