import type { Metadata } from "next";
import { RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountShell, Section } from "@/components/account/AccountShell";
import { loadAccount } from "@/lib/account";
import { getDashboardProgress } from "@/lib/progress";
import { resetProgress } from "@/app/dashboard/actions";
import { ChangePasswordForm } from "./change-password-form";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { LogoutButtonStyled } from "@/components/dashboard/logout-button";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const { person, session } = await loadAccount("/dashboard/account");
  const { completedLessons, totalLessons } = await getDashboardProgress();

  return (
    <AccountShell
      active="settings"
      person={person}
      title="Settings"
      summary="Your sign-in and your course progress."
      icon={Settings}
    >
      <VerifyEmailBanner />

      <Section
        title="Password"
        summary={
          session?.email
            ? `Signed in as ${session.email}`
            : "Requires your current password."
        }
      >
        <ChangePasswordForm />
      </Section>

      <Section
        title="Course progress"
        summary="The course is optional. Nothing in recruiting waits on it."
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {completedLessons} of {totalLessons} lessons marked complete.
          </p>
          <form action={resetProgress}>
            <Button type="submit" variant="outline" size="sm">
              <RotateCcw />
              Reset
            </Button>
          </form>
        </div>
      </Section>

      <LogoutButtonStyled className="w-full" />
    </AccountShell>
  );
}
