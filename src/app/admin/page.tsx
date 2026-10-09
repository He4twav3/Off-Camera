import type { Metadata } from "next";
import { getAdminWorkspace } from "@/lib/admin-workspace";
import { OverviewView } from "@/components/admin/overview-view";

export const metadata: Metadata = { title: "Overview · Admin" };

// What is waiting on you is the numbers beside the menu items. This page is the picture of the work:
// each campaign, the creators on it, their views and earnings, my earnings, then the payouts.
export default async function AdminHomePage() {
  return <OverviewView ws={await getAdminWorkspace()} />;
}
