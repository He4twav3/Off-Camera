"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "For creators" },
  { href: "/brands", label: "For brands" },
];

/** Floating pill: logo and the two audiences (current one highlighted). */
export function Nav() {
  const path = usePathname();
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Main"
        className="grid w-full max-w-[1000px] grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full border border-white/[0.08] bg-[#1d1c22]/85 py-3.5 pr-6 pl-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <div className="justify-self-start">
          {/* just the mark on phones, so the two labels fit on one line */}
          <span className="sm:hidden">
            <Logo variant="compact" />
          </span>
          <span className="hidden sm:inline-flex">
            <Logo />
          </span>
        </div>
        <div className="flex items-center gap-6 sm:gap-9">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path === l.href ? "page" : undefined}
              className={cn(
                "text-[0.7rem] font-bold tracking-[0.12em] whitespace-nowrap uppercase transition-colors sm:text-[0.75rem] sm:tracking-[0.16em]",
                path === l.href ? "text-[#e0556a]" : "text-[#a39e98] hover:text-[#edeae4]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {/* empty right column keeps the links truly centred */}
        <div aria-hidden />
      </nav>
    </header>
  );
}
