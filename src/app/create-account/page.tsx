import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { CreateAccountForm } from "./create-account-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

// Email + password account. Separate from /signup, which is the free-preview
// capture page that emails a sign-in link and sets no password.
export default async function CreateAccountPage(props: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await props.searchParams;
  const isBrand = type === "brand";
  return (
    <div className="dark-invert flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="card-sticker w-full max-w-md rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">
          {isBrand ? "Create a brand account" : "Join as a creator"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isBrand
            ? "Run campaigns with our creators and track the results. We\u2019ll email you a code to confirm it."
            : "Create your account, then we\u2019ll ask about your content. We\u2019ll email you a code to confirm it."}
        </p>
        <div className="mt-6">
          <CreateAccountForm accountType={isBrand ? "brand" : "creator"} />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isBrand ? "Are you a creator?" : "Are you a brand?"}{" "}
        <Link
          href={isBrand ? "/create-account" : "/create-account?type=brand"}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {isBrand ? "Join as a creator" : "Create a brand account"}
        </Link>
        <br />
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
