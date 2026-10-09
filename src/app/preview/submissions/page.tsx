// TEMPORARY. Never committed.
import { CreatorShell } from "../_shell";
import { SubmissionsView } from "@/components/app/SubmissionsView";
import { iso } from "../_data";

const t = { v: 1, videos: 1, fixedPerVideo: 60, cpm: { ratePer1000: 3, startsAt: 0 }, bonuses: [], capPerCreator: 400, measureDays: 14, fixedPaidOn: "approval" } as never;

export default async function Page(props: { searchParams: Promise<{ status?: string; filled?: string }> }) {
  const { status, filled } = await props.searchParams;
  return (
    <CreatorShell pathname="/dashboard/recruiting/submissions">
      <SubmissionsView
        status={status}
        basePath="/preview/submissions"
        campaignsPath="/preview/campaigns"
        totals={filled ? { submitted: 3, views: 18400, expected: 142, paid: 99 } : { submitted: 0, views: 0, expected: 0, paid: 0 }}
        rows={!filled ? [] : [
          { id: "1", jobId: "j1", status: "active", title: "Show how a budgeting app fits a student week", platform: "tiktok", assignedAt: iso(-4), paidAt: null, proofUrl: null, terms: t, views: 0, amount: 60, estimated: true },
          { id: "2", jobId: "j2", status: "submitted", title: "Unbox and test a portable blender", platform: "instagram", assignedAt: iso(-12), paidAt: null, proofUrl: "https://www.instagram.com/reel/example/", terms: t, views: 9100, amount: 82, estimated: true },
          { id: "3", jobId: "j3", status: "paid", title: "30-second morning skincare routine", platform: "tiktok", assignedAt: iso(-30), paidAt: iso(-9), proofUrl: "https://www.tiktok.com/@example/video/1", terms: null, views: 9300, amount: 99, estimated: false },
        ]}
      />
    </CreatorShell>
  );
}
