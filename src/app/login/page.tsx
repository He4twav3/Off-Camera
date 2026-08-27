import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { LoginForm } from "./login-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

// Dark to match "/" and "/signup" — the whole pre-dashboard flow reads as
// one continuous experience now instead of handing off to a stray light
// page partway through. min-h-screen, not min-h-full: this is a standalone
// route outside the marketing layout, and min-h-full's percentage-height
// chain doesn't reliably resolve all the way up through the root layout
// for a page like this (see the same fix already applied to /signup).
export default function LoginPage() {
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick up right where you left off.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Not enrolled yet?{" "}
        <Link
          href="/#pricing"
          className="font-medium text-foreground underline underline-offset-2"
        >
          See the course
        </Link>
      </p>
    </div>
  );
}
