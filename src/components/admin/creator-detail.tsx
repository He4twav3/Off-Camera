import Link from "next/link";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { PayoutCell } from "@/components/admin/payout-cell";
import { STATE_LABEL } from "@/lib/direct-pay";
import { PLATFORM_RULES } from "@/lib/handles";
import type { ACreator } from "@/lib/admin-workspace";
import { PLATFORM_LABELS, formatCurrency, formatDate } from "@/lib/utils";

const label = (p: string) => PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS] ?? p;

/**
 * Everything about one creator on one campaign, in the order the work goes: their social accounts,
 * their videos with views and what each earned, the payments, and where they get paid.
 */
export function CreatorDetail({ cr }: { cr: ACreator }) {
  const owed = Math.max(0, cr.statemented - cr.paid);
  return (
    <div className="grid gap-5 px-4 py-4 text-sm lg:grid-cols-2">
      <section>
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Social accounts</h4>
        {cr.accounts.length === 0 ? (
          <p className="text-muted-foreground">No accounts connected.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {cr.accounts.map((a) => {
              const rule = PLATFORM_RULES[a.platform as keyof typeof PLATFORM_RULES];
              return (
                <li key={`${a.platform}-${a.handle}`} className="flex flex-wrap items-center gap-x-3">
                  <span className="w-24 text-muted-foreground">{rule?.label ?? a.platform}</span>
                  <a
                    href={rule ? rule.profileUrl(a.handle.replace(/^@/, "")) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    @{a.handle.replace(/^@/, "")}
                  </a>
                  {a.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                      <BadgeCheck className="size-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                      <ShieldAlert className="size-3.5" />
                      Not verified
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <h4 className="mb-2 mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact and payout</h4>
        <p className="flex flex-wrap items-center gap-x-3">
          <span className="text-foreground">{cr.email}</span>
          <CopyButton value={cr.email} />
        </p>
        <div className="mt-1.5">
          <PayoutCell payout={cr.payout} />
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Videos</h4>
        {cr.posts.length === 0 ? (
          <p className="text-muted-foreground">No videos added yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-2 font-medium">Video</th>
                <th className="py-1 pr-2 font-medium">State</th>
                <th className="py-1 pr-2 text-right font-medium">Views</th>
                <th className="py-1 text-right font-medium">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {cr.posts.map((p) => (
                <tr key={p.id}>
                  <td className="py-1 pr-2">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {label(p.platform)}
                    </a>
                    {p.repost && <span className="ml-1 text-xs text-muted-foreground">repost</span>}
                  </td>
                  <td className="py-1 pr-2 text-muted-foreground">
                    {p.state === "rejected"
                      ? "Rejected"
                      : !p.verified
                        ? "Checking account"
                        : p.reviewed === false
                          ? "Needs review"
                          : p.state === "final"
                            ? "Final"
                            : "Counting"}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums">{p.views.toLocaleString()}</td>
                  <td className="py-1 text-right tabular-nums">{formatCurrency(p.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4 className="mb-2 mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Money</h4>
        <p className="tabular-nums text-muted-foreground">
          Earned <span className="text-foreground">{formatCurrency(cr.earned)}</span> · due so far{" "}
          <span className="text-foreground">{formatCurrency(cr.payable)}</span> · on statements{" "}
          <span className="text-foreground">{formatCurrency(cr.statemented)}</span> · paid{" "}
          <span className="text-foreground">{formatCurrency(cr.paid)}</span> · brand still owes{" "}
          <span className="text-foreground">{formatCurrency(owed)}</span> · my earnings{" "}
          <span className="text-foreground">{formatCurrency(cr.ourFees)}</span>
        </p>
        {cr.statements.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {cr.statements.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-x-3 text-muted-foreground">
                <span>Cycle {s.cycle}</span>
                <span className="text-foreground tabular-nums">{formatCurrency(s.amount)}</span>
                <span>{STATE_LABEL[s.state]}</span>
                <span>fee {formatCurrency(s.ourFee)}{s.feeReceived ? " received" : ""}</span>
                <span>due {formatDate(s.dueAt)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3">
          <Link href={`/admin/jobs/${cr.campaignId}/creators/${cr.assignmentId}`} className="text-xs font-semibold text-primary hover:underline">
            Open this creator to approve or deny videos →
          </Link>
        </p>
      </section>
    </div>
  );
}
