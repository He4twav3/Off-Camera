import type { Metadata } from "next";
import { BrandMark } from "@/components/site/brand-mark";
import { LoginForm } from "@/app/login/login-form";
import "@/styles/dark-invert.css";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

// The admin panel's own sign-in. It lives outside app/admin/layout.tsx (that layout
// requires a session, so the sign-in page can't sit inside it) and links nowhere:
// no creator sign-up, no link to the public site. Signing in always lands in /admin.
export default function AdminLoginPage() {
  return (
    <div className="dark-invert relative z-10 flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <div className="mb-8 flex items-center gap-2.5">
        <BrandMark className="size-7" />
        <span className="font-heading text-lg font-semibold">OnCamera</span>
        <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-semibold text-accent-ink">Admin</span>
      </div>

      <div className="card-sticker w-full max-w-sm rounded-2xl bg-card p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight">Admin sign-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Team members only. You&apos;ll be asked for your authenticator code next.</p>
        <div className="mt-6">
          <LoginForm next="/admin" />
        </div>
      </div>
    </div>
  );
}
