import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { teamSignupOpen } from "@/lib/team-signup";
import { TeamSignupForm } from "./team-signup-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Team sign-up",
  robots: { index: false, follow: false },
};

// Not linked from anywhere. Closed unless TEAM_SIGNUP_KEY is set, and meant to be
// closed again (key removed) once the team has signed up.
export default function TeamPage() {
  const open = teamSignupOpen(process.env.TEAM_SIGNUP_KEY);
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-md rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Team sign-up</h1>
        {open ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              For OnCamera team members. You need the team access key, and your email must already be on the team
              list. We&apos;ll email you a code to confirm it.
            </p>
            <div className="mt-6">
              <TeamSignupForm />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Team sign-up is closed.</p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login?next=/admin" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
