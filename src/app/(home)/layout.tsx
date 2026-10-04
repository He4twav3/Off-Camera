import type { ReactNode } from "react";
import { HomeNav } from "@/components/home/home-nav";
import { HomeFooter } from "@/components/home/home-footer";

/**
 * The homepage's own shell. Deliberately NOT the marketing group's layout: that
 * one carries the course page's cinematic dressing (film atmosphere, the
 * bottom name tag, the navbar with its section row and scroll progress). The
 * agency homepage is cleaner — flat dark ground, a floating pill nav, a simple
 * footer — in the same colours.
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <HomeNav />
      <main className="flex-1">{children}</main>
      <HomeFooter />
    </div>
  );
}
