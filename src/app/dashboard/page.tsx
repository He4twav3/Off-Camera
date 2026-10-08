import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Lock, Briefcase, GraduationCap } from "lucide-react";
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

export default async function DashboardPage() {
  // An admin account with no creator profile has nothing here: send it to admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const [{ data: isAdmin }, { data: creator }] = await Promise.all([
      supabase.rpc("is_admin"),
      supabase.from("applicants").select("id").eq("user_id", user.id).maybeSingle(),
    ]);
    if (isAdmin && !creator) redirect("/admin");
  }

  // The course isn't ready yet. Everything below stays in place for when it is: remove this
  // return to bring it back.
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <GraduationCap className="size-6" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight">
        The course is coming soon
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We&apos;re still putting it together. In the meantime you can browse campaigns and start earning.
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href="/dashboard/recruiting/jobs" />}
      >
        Browse campaigns
      </Button>
    </div>
  );

  // eslint-disable-next-line no-unreachable
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
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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

      {/* The course is optional. Campaigns are open to approved creators
          whether or not any lesson has been done. */}
      <p className="mt-6 rounded-lg border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
        The course is optional. You can{" "}
        <Link href="/dashboard/recruiting/jobs" className="font-semibold text-primary underline underline-offset-2">
          browse and apply to campaigns
        </Link>{" "}
        at any time.
      </p>

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
