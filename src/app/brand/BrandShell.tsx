import type { ReactNode } from "react";
import { Logo } from "@/components/site/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandNav } from "./BrandNav";

/**
 * The brand side's own app: a left menu with only what a brand needs (campaigns, creators,
 * payments, leaderboard, templates, settings). Nothing from the creator side. Used by
 * app/brand/layout.tsx.
 */
/** The logo with a "Brand" tag, like the admin has an "Admin" tag. */
function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo />
      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Brand</span>
    </div>
  );
}

export function BrandShell({
  children,
  company = "Your brand",
  approvals = 0,
}: {
  children: ReactNode;
  company?: string;
  /** Videos waiting for this brand to approve. */
  approvals?: number;
}) {
  return (
    <div className="app-ui relative z-10 flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-border/70 bg-card lg:block">
        <div className="flex min-h-full flex-col px-3 py-4">
          <div className="px-3 pb-4">
            <BrandLogo />
          </div>
          <div className="flex-1">
            <BrandNav variant="rail" approvals={approvals} />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-primary/15 text-sm font-medium text-primary">
                  {company.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{company}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <BrandLogo />
            <span className="truncate text-sm font-medium text-muted-foreground">{company}</span>
          </div>
          <BrandNav variant="row" approvals={approvals} />
        </header>
        <main className="w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
