// TEMPORARY. Never committed. Same look as the real creator layout, but every link stays inside /preview.
"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, UserCircle, Send, Wallet, GraduationCap, ChevronRight } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/preview/campaigns", label: "Campaigns", icon: Briefcase },
  { href: "/preview/submissions", label: "Submissions", icon: Send },
  { href: "/preview/earnings", label: "Earnings", icon: Wallet },
  { href: "/preview/profile", label: "Profile", icon: UserCircle },
];
const SECOND = [{ href: "/preview/course", label: "Course (optional)", icon: GraduationCap }];
const AREA = ["/preview/profile", "/preview/accounts", "/preview/videos", "/preview/payments", "/preview/account"];
const AREA_LABEL: Record<string, string> = { "/preview/profile": "Profile", "/preview/accounts": "Accounts", "/preview/videos": "Videos", "/preview/payments": "Payments", "/preview/account": "Settings" };
const CRUMBS: Record<string, string> = {
  "/preview/creator": "Home", "/preview/campaigns": "Campaigns", "/preview/apply": "Campaigns",
  "/preview/submissions": "Submissions", "/preview/earnings": "Earnings", "/preview/profile": "Profile",
  "/preview/course": "Course", "/preview/account": "Account",
};

function Item({ href, label, icon: Icon, count, active }: { href: string; label: string; icon: typeof Send; count?: number; active: boolean }) {
  return (
    <Link href={href} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <Icon className="size-4 shrink-0" /><span className="flex-1">{label}</span>
      {!!count && <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-xs font-semibold text-primary-foreground">{count}</span>}
    </Link>
  );
}

export function CreatorShell({ children }: { pathname?: string; children: ReactNode }) {
  const path = usePathname();
  const section = CRUMBS[path] ?? "Home";
  const onApply = ["/preview/apply", "/preview/campaign", "/preview/join", "/preview/getimg"].includes(path);
  return (
    <div className="app-ui relative z-10 flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border/70 bg-card lg:block">
        <div className="flex min-h-full flex-col px-3 py-4">
          <div className="px-3 pb-4"><Logo /></div>
          <nav className="flex flex-col gap-8">
            <div className="flex flex-col gap-0.5">{MAIN.map((i) => <Item key={i.href} {...i} active={path === i.href || (onApply && i.href === "/preview/campaigns") || (i.href === "/preview/profile" && AREA.includes(path))} />)}</div>
            <div className="flex flex-col gap-0.5 border-t border-border/70 pt-4">{SECOND.map((i) => <Item key={i.href} {...i} active={path === i.href} />)}</div>
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-b border-border/70 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link href="/preview/campaigns" className="text-muted-foreground hover:text-foreground">Creator</Link>
            <ChevronRight className="size-3.5 text-muted-foreground/70" />
            {AREA.includes(path) ? (<><span className="text-muted-foreground">Account</span><ChevronRight className="size-3.5 text-muted-foreground/70" /><span className="font-medium">{AREA_LABEL[path]}</span></>) : onApply ? (<><Link href="/preview/campaigns" className="text-muted-foreground hover:text-foreground">Campaigns</Link>
              <ChevronRight className="size-3.5 text-muted-foreground/70" /><span className="font-medium">Campaign</span></>)
              : <span className="font-medium">{section}</span>}
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}
