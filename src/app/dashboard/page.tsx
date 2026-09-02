import Link from "next/link";
import { Lock, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { ModuleProgressList } from "@/components/dashboard/module-progress-list";
import { SidebarCards } from "@/components/dashboard/sidebar-cards";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";
import { siteConfig } from "@/lib/site-config";
import { TOTAL_LESSONS, TOTAL_MODULES } from "@/lib/curriculum";
import { COURSE_IS_FREE } from "@/lib/feature-flags";

export default async function DashboardPage(props: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await props.searchParams;
  const session = await getSession();
  const firstName = session?.displayName.split(" ")[0] ?? "Creator";

  // Signing in and paying for the course are two separate facts — an
  // account existing (e.g. from /signup, which never touches payment)
  // doesn't mean this person bought anything. `session.paid` is only
  // ever set by a confirmed payment webhook (see fulfillment.ts), never
  // by anything client-side, so this is a genuine gate, not UI theater —
  // the lesson-completion action checks the same field server-side.
  // Currently bypassed sitewide while the course is free (see
  // lib/auth.ts's COURSE_IS_FREE) — this block is effectively dead code
  // until that's turned back off, kept exactly as it'll need to work
  // again then.
  if (!session?.paid) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Your account is set up, but you haven&apos;t enrolled in the course yet.
        </p>

        <div className="card-sticker mt-8 max-w-md rounded-2xl bg-card p-8 text-center">
          <span className="pill-outline mx-auto flex size-14 items-center justify-center rounded-full bg-toy-soft text-toy-soft-foreground">
            <Lock className="size-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Unlock On Camera</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {TOTAL_MODULES} modules, {TOTAL_LESSONS} lessons, pitch &amp;
            contract templates, and lifetime access
            {COURSE_IS_FREE ? ", free right now." : ` for ${siteConfig.price.formatted}.`}
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/signup" />}
            className="btn-sticker mt-6 w-full"
          >
            Save your spot
          </Button>
        </div>
      </div>
    );
  }

  const { percent, completedLessons, isComplete } = await getDashboardProgress();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1.5 text-muted-foreground">
        {completedLessons === 0
          ? "You're just getting started. Mark off your first lesson below."
          : `You're ${percent}% through On Camera. Keep the momentum going.`}
      </p>

      <div className="mt-6">
        <VerifyEmailBanner />
      </div>

      {reason === "finish_course_first" && (
        <p className="mt-6 rounded-lg border-2 border-ink bg-accent px-4 py-3 text-sm font-medium text-accent-foreground">
          Finish every lesson to unlock recruiting — you&apos;re at {percent}%
          right now.
        </p>
      )}

      {/* The training->recruiting handoff — only appears once every lesson
          is done. This is the moment the product becomes more than a course:
          the same account now unlocks paid brand placements. The route
          itself is gated too (dashboard/recruiting/layout.tsx), so this is
          a real unlock, not just a UI nudge someone could ignore by typing
          the URL directly. */}
      {isComplete && (
        <div className="card-sticker mt-6 flex flex-col items-start gap-4 rounded-2xl bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="pill-outline flex size-12 shrink-0 items-center justify-center rounded-full bg-toy-soft text-toy-soft-foreground">
              <Briefcase className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">You&apos;ve completed the course</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up your creator profile and start browsing campaigns.
                Strong creators who demonstrate their ability may be
                introduced to real brand opportunities through the network —
                earned, not automatic.
              </p>
            </div>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/recruiting/profile-setup" />}
            className="btn-sticker w-full shrink-0 sm:w-auto"
          >
            Get started
          </Button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <StatCards />
          <ContinueLearning />
          <ModuleProgressList />
        </div>
        <SidebarCards />
      </div>
    </div>
  );
}
