import Link from "next/link";
import { Logo } from "@/components/site/logo";
import "@/styles/dark-invert.css";

/** Shown in place of the sign-up and code pages while SIGNUPS_OPEN is not "on". */
export function SignupsClosed() {
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Sign-ups are closed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;re not taking new accounts right now. Check back soon.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
