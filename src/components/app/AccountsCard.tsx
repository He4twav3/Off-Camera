import { BadgeCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { verificationCode } from "@/lib/handle-verification";
import { PLATFORM_LABELS } from "@/lib/utils";
import type { ApplicantHandle } from "@/lib/database.types";
import { VerifyHandleForm } from "./VerifyHandleForm";

/**
 * The creator's social accounts and whether each is proven to be theirs. An
 * unverified account shows a short code to put in that account's bio; the
 * "Check my bio" button then looks for it (see lib/handle-verification.ts).
 */
export function AccountsCard({
  applicantId,
  handles,
}: {
  applicantId: string;
  handles: ApplicantHandle[];
}) {
  return (
    <Card className="border-border/70">
      <CardContent>
        <h2 className="font-heading text-base font-semibold text-foreground">Your accounts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify each account so we know it&apos;s really yours. Campaigns and payouts only count verified ones.
        </p>

        {handles.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No accounts yet. Add them in your profile.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {handles.map((h) => {
              const code = verificationCode(applicantId, h.platform, h.handle);
              return (
                <li key={h.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-semibold text-foreground">
                      {PLATFORM_LABELS[h.platform]}{" "}
                      <span className="font-normal text-muted-foreground">@{h.handle}</span>
                    </p>
                    {h.verified_at ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-toy-soft-foreground">
                        <BadgeCheck size={16} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                        <Clock size={15} />
                        Not verified
                      </span>
                    )}
                  </div>

                  {!h.verified_at && (
                    <div className="mt-3 rounded-md bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
                      <p>
                        Add this code to your {PLATFORM_LABELS[h.platform]} bio, save it, then check. You can
                        remove it afterwards.
                      </p>
                      <p className="mt-2 select-all font-mono text-base font-semibold tracking-wide text-foreground">
                        {code}
                      </p>
                      <VerifyHandleForm handleId={h.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
