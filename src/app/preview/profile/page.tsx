// TEMPORARY. Never committed. Default: a new creator (blank form). ?filled=1 for a saved profile.
import { User } from "lucide-react";
import { AccountPreview } from "../_account";
import { ProfileForm } from "@/app/dashboard/recruiting/profile-setup/ProfileForm";
import { DiscordCard } from "@/components/account/DiscordCard";

export default async function Page(props: { searchParams: Promise<{ filled?: string; fresh?: string }> }) {
  const { filled, fresh } = await props.searchParams;
  const saved = Boolean(filled || fresh);
  const existing = {
    id: "a1", name: "Maya Rivers", username: "mayarivers", location: "Lisbon, Portugal", date_of_birth: "2000-04-12",
    skills: ["On camera", "Editing"], brands_worked_with: ["Glow Labs", "Pocket Pay"], platform: "tiktok", handle: "mayarivers", avatar_url: null,
  } as never;
  return (
    <AccountPreview who={saved ? undefined : { name: "Your name", username: null, avatarUrl: null }} active="profile" title="Profile" summary="Manage your personal information and account settings." icon={User}>
      <ProfileForm existing={saved ? existing : null} defaultName="" />
      {saved && <DiscordCard username={null} />}
    </AccountPreview>
  );
}
