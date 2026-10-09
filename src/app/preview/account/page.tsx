// TEMPORARY. Never committed.
import { RotateCcw, Settings } from "lucide-react";
import { AccountPreview } from "../_account";
import { Section } from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/app/dashboard/account/change-password-form";

export default function Page() {
  return (
    <AccountPreview active="settings" title="Settings" summary="Your sign-in and your course progress." icon={Settings}>
      <Section title="Password" summary="Signed in as maya@example.com"><ChangePasswordForm /></Section>
      <Section title="Course progress" summary="The course is optional. Nothing in recruiting waits on it.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">3 of 24 lessons marked complete.</p>
          <Button variant="outline" size="sm"><RotateCcw />Reset</Button>
        </div>
      </Section>
      <Button variant="outline" className="w-full">Log out</Button>
    </AccountPreview>
  );
}
