import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Video } from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { VideosCard } from "@/components/app/VideosCard";
import { loadAccount } from "@/lib/account";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosPage() {
  const { supabase, applicant, person } = await loadAccount(
    "/dashboard/account/videos",
  );
  if (!applicant) redirect("/dashboard/recruiting/profile-setup");

  // RLS: only this creator's own videos.
  const { data: videos } = await supabase
    .from("applicant_videos")
    .select("id, platform, url, title")
    .eq("applicant_id", applicant.id)
    .order("created_at", { ascending: false });

  return (
    <AccountShell
      active="videos"
      person={person}
      title="Videos"
      summary="Your best-performing videos. Brands see these first."
      icon={Video}
    >
      <VideosCard videos={videos ?? []} />
    </AccountShell>
  );
}
