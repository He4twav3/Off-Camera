"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/site/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SidebarAccount } from "@/components/dashboard/sidebar-account";
import type { ShellData } from "@/lib/shell-data";

/** The sidebar's small-screen equivalent — a drawer instead of a persistent
 * rail, same nav content so the two never drift apart into two different
 * navigation structures. */
export function MobileNav({ shell }: { shell: ShellData }) {
  const [open, setOpen] = useState(false);
  if (!shell.session) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <SheetContent side="left" className="flex flex-col p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo />
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-4" onClick={() => setOpen(false)}>
          <SidebarNav
            courseComplete={shell.courseComplete}
            recruitingCounts={shell.recruiting}
            isAdmin={shell.isAdmin}
          />
        </div>
        <div className="px-3 pb-4">
          <SidebarAccount
            displayName={shell.session.displayName}
            email={shell.session.email}
            initials={shell.session.initials}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
