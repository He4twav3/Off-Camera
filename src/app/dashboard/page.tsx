import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { ModuleProgressList } from "@/components/dashboard/module-progress-list";
import { SidebarCards } from "@/components/dashboard/sidebar-cards";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { getSession } from "@/lib/auth";
import { getDashboardProgress } from "@/lib/progress";
import { siteConfig } from "@/lib/site-config";

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.displayName.split(" ")[0] ?? "Student";

  // Signing in and paying for the course are two separate facts — an
  // account existing (e.g. from /signup, which never touches payment)
  // doesn't mean this person bought anything. `session.paid` is only
  // ever set by a confirmed payment webhook (see fulfillment.ts), never
  // by anything client-side, so this is a genuine gate, not UI theater —
  // the lesson-completion action checks the same field server-side.
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
          <h2 className="mt-4 text-lg font-semibold">Unlock Off Camera</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            8 modules, 25 lessons, pitch &amp; contract templates, and lifetime
            access for {siteConfig.price.formatted}.
          </p>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/checkout" />}
            className="btn-sticker mt-6 w-full"
          >
            Enroll now
          </Button>
        </div>
      </div>
    );
  }

  const { percent, completedLessons } = await getDashboardProgress();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome back, {firstName}
      </h1>
      <p className="mt-1.5 text-muted-foreground">
        {completedLessons === 0
          ? "You're just getting started. Mark off your first lesson below."
          : `You're ${percent}% through Off Camera. Keep the momentum going.`}
      </p>

      <div className="mt-6">
        <VerifyEmailBanner />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
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
