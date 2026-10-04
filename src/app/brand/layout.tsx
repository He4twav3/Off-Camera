import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { createClient } from "@/lib/supabase/server";
import "@/styles/dark-invert.css";

/**
 * The brand side's own shell — separate from the creator/course dashboard,
 * which has course navigation brands have no use for. Signed-in only (the
 * proxy covers /brand); anyone without a brand account goes to the normal
 * dashboard.
 */
export default async function BrandLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/brand");

  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) redirect("/dashboard");

  return (
    <div className="dark-invert flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Logo />
          <nav className="flex items-center gap-5">
            <Link href="/brand" className="text-[15px] font-semibold hover:text-primary">
              Campaigns
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="cursor-pointer text-[15px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
