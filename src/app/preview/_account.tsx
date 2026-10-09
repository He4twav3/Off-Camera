// TEMPORARY. Never committed. Shared bits for the account-area previews.
import type { ReactNode } from "react";
import { AccountShell, type AccountSection } from "@/components/account/AccountShell";
import type { User } from "lucide-react";
import { CreatorShell } from "./_shell";

export const person = { name: "Your name", username: null, avatarUrl: null };
const HREFS: Record<AccountSection, string> = {
  profile: "/preview/profile", accounts: "/preview/accounts", videos: "/preview/videos", payments: "/preview/payments", settings: "/preview/account",
};

export function AccountPreview({ active, title, summary, icon, children, who = person }: { active: AccountSection; title: string; summary: string; icon: typeof User; children: ReactNode; who?: { name: string; username: string | null; avatarUrl: null } }) {
  return (
    <CreatorShell>
      <AccountShell active={active} person={who} title={title} summary={summary} icon={icon} hrefFor={(s) => HREFS[s.key]}>
        {children}
      </AccountShell>
    </CreatorShell>
  );
}

export const handles = [
  { id: "h1", applicant_id: "a1", platform: "tiktok", handle: "mayarivers", follower_count: 18400, is_primary: true, verified_at: new Date().toISOString() },
  { id: "h2", applicant_id: "a1", platform: "instagram", handle: "maya.rivers", follower_count: 6200, is_primary: false, verified_at: null },
] as never[];
