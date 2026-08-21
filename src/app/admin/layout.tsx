import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/applicants", label: "Creators" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/niches", label: "Niches" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/jobs");

  // Second gate behind the middleware check — same is_admin() allowlist that
  // backs the RLS policies, so a direct request can't slip past.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-heading text-lg font-semibold text-foreground transition-colors duration-200 hover:text-primary"
            >
              Off<span className="text-primary"> Camera</span>
              <span className="ml-2 rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
                Admin
              </span>
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {ADMIN_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[15px] font-semibold text-foreground transition-colors duration-200 hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="cursor-pointer text-[15px] font-semibold text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
