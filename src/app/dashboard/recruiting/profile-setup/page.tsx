import type { Metadata } from "next";
import { User } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { DiscordCard } from "@/components/account/DiscordCard";
import { loadAccount } from "@/lib/account";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
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
      <ProfileForm
        existing={applicant ?? null}
        defaultName={session?.displayName ?? ""}
      />
      {applicant && <DiscordCard username={applicant.discord_username} />}
    </AccountShell>
  );
}
