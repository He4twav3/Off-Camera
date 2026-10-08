import Link from "next/link";
import {
  PageShell,
  PageHeader,
  Stat,
  StatGrid,
  Tabs,
  RowList,
  Row,
  Facts,
} from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { PayStrip } from "@/components/app/PayStrip";
import { assignmentStatusTone } from "@/components/ui/status-badge";
import type { PayoutTerms } from "@/lib/payout-terms";
import { formatCurrency, formatDate, PLATFORM_LABELS } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  active: "In progress",
  submitted: "In review",
  paid: "Paid",
  disputed: "Being looked at",
};

export type SubmissionRow = {
  id: string;
  jobId: string | null;
  status: string;
  title: string;
  platform: keyof typeof PLATFORM_LABELS | null;
  assignedAt: string;
  paidAt: string | null;
  proofUrl: string | null;
  /** Campaigns paid per post: how many posts, and where to see them. */
  posts?: { sent: number; counting: number; rejected: number; href: string } | null;
  terms: PayoutTerms | null;
  views: number;
  amount: number;
  estimated: boolean;
};

const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "active", label: "In progress", match: (s: string) => s === "active" },
  {
    key: "submitted",
    label: "In review",
    match: (s: string) => s === "submitted",
  },
  { key: "paid", label: "Paid", match: (s: string) => s === "paid" },
];

export function SubmissionsView({
  rows,
  totals,
  status = "all",
  basePath = "/dashboard/recruiting/submissions",
  campaignsPath = "/dashboard/recruiting/jobs",
}: {
  rows: SubmissionRow[];
  totals: { submitted: number; views: number; expected: number; paid: number };
  status?: string;
  basePath?: string;
  campaignsPath?: string;
}) {
  const active = FILTERS.some((f) => f.key === status) ? status : "all";
  const shown = rows.filter((r) =>
    FILTERS.find((f) => f.key === active)!.match(r.status),
  );
  return (
    <PageShell>
      <PageHeader
        title="Submissions"
        summary="Every campaign you're on, the post you sent, its views and what it earns."
      />

      <StatGrid>
        <Stat label="Posts sent" value={String(totals.submitted)} />
        <Stat
          label="Total views"
          value={totals.views.toLocaleString("en-US")}
        />
        <Stat label="Expected" value={formatCurrency(totals.expected)} />
        <Stat label="Paid" value={formatCurrency(totals.paid)} attention />
      </StatGrid>

      <Tabs
        active={active}
        items={FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          count: rows.filter((r) => f.match(r.status)).length,
          href: f.key === "all" ? basePath : `${basePath}?status=${f.key}`,
        }))}
      />

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            No submissions found
          </p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-muted-foreground">
            {rows.length === 0
              ? "You haven't sent in any posts yet. Join a campaign to begin earning."
              : "Nothing here with that status."}
          </p>
          {rows.length === 0 && (
            <Button
              className="mt-5"
              nativeButton={false}
              render={<Link href={campaignsPath} />}
            >
              Explore campaigns
            </Button>
          )}
        </div>
      ) : (
        <RowList>
          {shown.map((r) => (
            <Row
              key={r.id}
              title={r.title}
              meta={`${r.platform ? `${PLATFORM_LABELS[r.platform]} · ` : ""}${r.views.toLocaleString("en-US")} views`}
              status={STATUS_LABEL[r.status] ?? r.status}
              statusTone={assignmentStatusTone(r.status as never)}
              figure={formatCurrency(r.amount)}
              figureLabel={
                r.status === "paid"
                  ? "Paid"
                  : r.estimated
                    ? "Estimated so far"
                    : "Pay"
              }
              detailsLabel="Details"
              details={
                <div className="flex flex-col gap-4">
                  {r.terms && <PayStrip terms={r.terms} />}
                  <Facts
                    items={[
                      { label: "Assigned", value: formatDate(r.assignedAt) },
                      ...(r.paidAt
                        ? [{ label: "Paid", value: formatDate(r.paidAt) }]
                        : []),
                      {
                        label: r.posts ? "Your posts" : "Your post",
                        value: r.posts ? (
                          <span>
                            {r.posts.sent} sent, {r.posts.counting} counting
                            {r.posts.rejected > 0 ? `, ${r.posts.rejected} rejected` : ""}.{" "}
                            <Link
                              href={r.posts.href}
                              className="font-semibold text-primary underline underline-offset-2"
                            >
                              See your posts
                            </Link>
                          </span>
                        ) : r.proofUrl ? (
                          <a
                            href={r.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary underline underline-offset-2"
                          >
                            View your post
                          </a>
                        ) : (
                          <Link
                            href={
                              r.jobId
                                ? `/dashboard/recruiting/jobs/${r.jobId}`
                                : campaignsPath
                            }
                            className="font-semibold text-primary underline underline-offset-2"
                          >
                            Send in your post
                          </Link>
                        ),
                      },
                    ]}
                  />
                </div>
              }
            />
          ))}
        </RowList>
      )}
    </PageShell>
  );
}
