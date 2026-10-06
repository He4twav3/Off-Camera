import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { TeamVerifyForm } from "./team-verify-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Enter your code",
  robots: { index: false, follow: false },
};

export default async function TeamVerifyPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await props.searchParams;
  if (!email) redirect("/team");

  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          If <span className="font-medium text-foreground">{email}</span> is on the team list, we sent it a 6-digit code.
        </p>
        <div className="mt-6">
          <TeamVerifyForm email={email} />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link href="/team" className="font-medium text-foreground underline underline-offset-2">
          Start over
        </Link>
      </p>
    </div>
  );
}
