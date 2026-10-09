// TEMPORARY. Never committed.
import { Video } from "lucide-react";
import { AccountPreview } from "../_account";
import { VideosCard } from "@/components/app/VideosCard";
import { videos } from "../_data";

export default async function Page(props: { searchParams: Promise<{ filled?: string }> }) {
  const { filled } = await props.searchParams;
  return (
    <AccountPreview active="videos" title="Videos" summary="Your best-performing videos. Brands see these first." icon={Video}>
      <VideosCard videos={filled ? videos.slice(0, 3) : []} />
    </AccountPreview>
  );
}
