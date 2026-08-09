import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";

export const metadata: Metadata = {
  title: "Dashboard",
  // Logged-in app area, not a marketing page — keep it out of search results.
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-secondary/30">
      <Topbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
