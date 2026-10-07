"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_PROFILE_VIDEOS, parseVideoLink } from "@/lib/creator-videos";

export interface VideoState {
  error?: string;
  success?: string;
}

const addSchema = z.object({
  url: z.string().trim().max(600),
  title: z.string().trim().max(80).optional(),
});

/** Adds one of the creator's own videos to their profile. */
export async function addVideoAction(_prev: VideoState, formData: FormData): Promise<VideoState> {
  const parsed = addSchema.safeParse({ url: formData.get("url") ?? "", title: formData.get("title") ?? "" });
  if (!parsed.success) return { error: "Check the link and the title (80 characters at most)." };

  const link = parseVideoLink(parsed.data.url);
  if (!link.ok) return { error: link.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data: applicant } = await supabase.from("applicants").select("id").eq("user_id", user.id).maybeSingle();
  if (!applicant) return { error: "Set up your profile first." };

  // Row-level security allows this only for the creator's own profile; the database
  // also enforces the limit and refuses a repeat of the same link.
  const { error } = await supabase.from("applicant_videos").insert({
    applicant_id: applicant.id,
    platform: link.platform,
    url: link.url,
    title: parsed.data.title || null,
  });
  if (error) {
    if (error.code === "23505") return { error: "That video is already on your profile." };
    if (error.message.includes("too_many_videos")) {
      return { error: `You can keep up to ${MAX_PROFILE_VIDEOS} videos. Remove one to add another.` };
    }
    return { error: "We couldn't add that video. Please try again." };
  }

  revalidatePath("/dashboard/recruiting");
  return { success: "Added." };
}

const removeSchema = z.object({ id: z.string().uuid() });

/** Removes a video from the profile. Applications already sent keep their own copy. */
export async function removeVideoAction(formData: FormData): Promise<void> {
  const parsed = removeSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createClient();
  // Row-level security limits this to the signed-in creator's own videos.
  await supabase.from("applicant_videos").delete().eq("id", parsed.data.id);
  revalidatePath("/dashboard/recruiting");
}
