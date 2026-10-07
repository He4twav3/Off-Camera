import { BadgeCheck, Link2, ShieldAlert } from "lucide-react";
import { Section } from "@/components/account/AccountShell";
import { AddAccount, RemoveAccount } from "@/components/account/AddAccount";
import { CodeChip } from "@/components/account/CodeChip";
import { PlatformIcon } from "@/components/account/PlatformIcons";
import { VerifyHandleForm } from "@/components/app/VerifyHandleForm";
import { verificationCode } from "@/lib/handle-verification";
import type { ApplicantHandle } from "@/lib/database.types";

const COLUMNS = "sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]";

/**
 * "Social Accounts": the platform buttons, then a table of your accounts. An account
 * that isn't verified yet shows its code, to put in the bio, and a Verify button.
 */
export function SocialAccounts({ applicantId, handles }: { applicantId: string; handles: ApplicantHandle[] }) {
  return (
    <Section
      title="Social Accounts"
      summary={handles.length ? `${handles.length} connected` : "No accounts connected yet"}
      aside={<AddAccount />}
    >
      {handles.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Link2 className="size-10 text-muted-foreground/60" />
          <p className="mt-3 font-heading text-lg font-semibold text-foreground">No accounts connected</p>
          <p className="mt-1 text-sm text-muted-foreground">Connect your social media accounts to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/70">
          <div className={`hidden gap-4 border-b border-border/70 px-5 py-3 text-sm font-medium text-foreground sm:grid ${COLUMNS}`}>
            <span>Account</span>
            <span>Status</span>
            <span className="w-16" />
          </div>
          <ul className="divide-y divide-border/70">
            {handles.map((h) => (
              <li key={h.id} className={`grid grid-cols-1 items-center gap-3 px-5 py-4 sm:gap-4 ${COLUMNS}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <PlatformIcon platform={h.platform} className="size-5 shrink-0" />
                  <span className="truncate text-[15px] font-semibold text-foreground">{h.handle}</span>
                  {h.is_primary && <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">Main</span>}
                </div>

                {h.verified_at ? (
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1 text-sm font-medium text-toy-soft-foreground">
                      <BadgeCheck size={15} />
                      Verified
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1 text-sm font-medium text-foreground">
                        <ShieldAlert size={15} className="text-amber-500" />
                        Unverified
                      </span>
                      <CodeChip code={verificationCode(applicantId, h.platform, h.handle)} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-muted-foreground">Add this code to your bio</span>
                      <VerifyHandleForm handleId={h.id} />
                    </div>
                  </div>
                )}

                <div className="sm:justify-self-end">
                  <RemoveAccount id={h.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
