import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CampaignBanner } from "@/components/app/CampaignBanner";
import { MoneyBar } from "@/components/tracking/TrackingHeader";
import { money } from "@/lib/fees";
import type { MyCampaignRow } from "@/lib/my-campaigns";
import { PLATFORM_LABELS } from "@/lib/utils";

/**
 * "My campaigns": the campaigns you've joined, each with its tracking in short. A
 * campaign paid per post shows what you've earned, the money bar and how far through
 * the payment cycle you are; clicking it opens the full tracking. Any other campaign
 * shows its status and expected pay.
 */
export function MyCampaigns({
  rows,
  hrefFor = (r) =>
    r.kind === "post"
      ? `/dashboard/recruiting/earnings/${r.assignmentId}`
      : `/dashboard/recruiting/jobs/${r.jobId}`,
  note,
}: {
  rows: MyCampaignRow[];
  /** A line under the heading explaining what the numbers are. */
  note?: string;
  /** Where a row goes. The default is its tracking page (or the campaign page for a basic campaign). */
  hrefFor?: (row: MyCampaignRow) => string;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          My campaigns
        </h2>
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "campaign" : "campaigns"}
        </p>
      </div>
      {note && (
        <p className="-mt-1 mb-3 text-sm text-muted-foreground">{note}</p>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.assignmentId}>
            <Link
              href={hrefFor(r)}
              className="group flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
            >
              <CampaignBanner
                seed={r.jobId}
                headline={r.title.slice(0, 1)}
                logoUrl={r.logoUrl}
                className="size-14 shrink-0 rounded-lg !p-2 text-center [&_p]:text-xl"
              />

              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-[15px] font-semibold text-foreground">
                  {r.title}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {PLATFORM_LABELS[
                    r.platform as keyof typeof PLATFORM_LABELS
                  ] ?? r.platform}
                  {r.kind === "post"
                    ? ` · ${r.views.toLocaleString("en-US")} views`
                    : r.statusLabel
                      ? ` · ${r.statusLabel}`
                      : ""}
                </p>
              </div>

              {r.kind === "post" && r.bar ? (
                <div className="w-full basis-72 sm:w-auto">
                  <div className="mb-1.5 flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">
                        {r.inCycle}
                      </span>
                      /{r.cycleSize} posts this cycle
                    </span>
                    <span className="font-heading text-base font-semibold tabular-nums text-foreground">
                      {money(r.amount)}
                    </span>
                  </div>
                  <MoneyBar {...r.bar} compact />
                </div>
              ) : (
                <div className="text-right">
                  <p className="font-heading text-base font-semibold tabular-nums text-foreground">
                    {money(r.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">expected</p>
                </div>
              )}

              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
