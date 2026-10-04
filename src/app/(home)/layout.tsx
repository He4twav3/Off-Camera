import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { Nav } from "@/components/kora/nav";
import { Footer } from "@/components/kora/footer";
import "@/styles/kora.css";

const geist = Geist({ subsets: ["latin"], display: "swap" });

/**
 * The creators (/) and brands (/brands) pages: their own shell, their own
 * typeface (Geist) and a flat, airy layout — nothing from the course page's
 * look. Colours are the OnCamera palette.
 */
export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${geist.className} ko-root relative flex min-h-screen flex-col bg-[#16151a] text-[#edeae4] antialiased`}>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
