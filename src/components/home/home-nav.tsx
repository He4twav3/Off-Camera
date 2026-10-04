import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

/** Floating pill nav: logo, the two audiences, log in, get started. */
export function HomeNav() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border border-hairline bg-surface-2/85 py-2 pr-2 pl-5 backdrop-blur-xl"
      >
        <Logo />
        <div className="hidden items-center gap-7 text-[0.8125rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:flex">
          <Link href="/#creators" className="transition-colors hover:text-foreground">
            For creators
          </Link>
          <Link href="/#brands" className="transition-colors hover:text-foreground">
            For brands
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2 text-[0.8125rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/create-account" />}
            className="btn-cta-glass h-9 rounded-full px-4 text-sm font-bold text-cta-foreground"
          >
            Get started
          </Button>
        </div>
      </nav>
    </header>
  );
}
