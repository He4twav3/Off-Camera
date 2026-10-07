import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import "@/styles/dark-invert.css";

/** The brand side's frame: logo, one link home, sign out. Used by app/brand/layout.tsx. */
export function BrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark-invert flex min-h-screen flex-col bg-background text-foreground">
      {/* relative z-10 on header and main: the site draws a fixed dark vignette (dark-invert.css)
          that would otherwise paint over them and dim content near the bottom of the screen. */}
      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-5">
            <Link href="/brand" className="text-[15px] font-semibold hover:text-primary">
              Dashboard
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
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}
