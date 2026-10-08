"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePayout, parsePayoutTerms } from "@/lib/payout-terms";
import { submitPost } from "@/lib/post-tracking";
import { sendApplicationReceivedEmail } from "@/lib/email/notifications";
import { parseDriveLink } from "@/lib/drive-link";
import { pickVideoIds } from "@/lib/creator-videos";

export interface ApplyState {
  error?: string;
  success?: string;
}

const applySchema = z.object({
  job_id: z.string().uuid(),
  cover_note: z.string().trim().max(1000).optional(),
  sample_url: z.string().trim().max(500).optional(),
});

export async function applyToJobAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse({
    job_id: formData.get("job_id"),
    cover_note: formData.get("cover_note") ?? "",
    sample_url: formData.get("sample_url") ?? "",
  });

  if (!parsed.success) {
    return { error: "Something was off with that application. Try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You need to be logged in to apply." };

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, name, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!applicant) {
    return { error: "Set up your profile before applying." };
  }
  if (applicant.status !== "approved") {
    return {
      error:
        "Your profile is still being reviewed. Once you're approved you can apply to campaigns.",
    };
  }

  // Don't let people apply to something that's already gone.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, status, sample_required")
    .eq("id", parsed.data.job_id)
    .maybeSingle();

  if (!job) return { error: "That campaign no longer exists." };
  if (job.status !== "open") {
    return { error: "This campaign isn't taking applications any more." };
  }

  // The sample video is only asked for when the campaign turns it on. If the
  // creator pastes one anyway it still has to be a real Google Drive link.
  let sampleUrl: string | null = null;
  if (job.sample_required || parsed.data.sample_url) {
    const link = parseDriveLink(parsed.data.sample_url ?? "");
    if (!link.ok) return { error: link.error };
    sampleUrl = link.url;
  }

  // The videos the creator chose to apply with. They must be on the creator's own
  // profile (row-level security only shows them their own); the links are copied
  // onto the application so later profile changes don't alter what was sent.
  const picked = pickVideoIds(formData.getAll("video_ids").map(String));
  if (!picked.ok) return { error: picked.error };
  const { data: owned } = await supabase
    .from("applicant_videos")
    .select("id, url")
    .eq("applicant_id", applicant.id)
    .in("id", picked.ids);
  if (!owned || owned.length !== picked.ids.length) {
    return {
      error:
        "One of those videos is no longer on your profile. Refresh the page and pick again.",
    };
  }
  const urlById = new Map(owned.map((v) => [v.id, v.url]));
  const videoUrls = picked.ids.map((id) => urlById.get(id)!);

  const { error } = await supabase.from("applications").insert({
    job_id: parsed.data.job_id,
    applicant_id: applicant.id,
    cover_note: parsed.data.cover_note || null,
    sample_url: sampleUrl,
    video_urls: videoUrls,
  });

  if (error) {
    // 23505 = unique_violation on (job_id, applicant_id).
    if (error.code === "23505") {
      return { error: "You've already applied to this campaign." };
    }
    return { error: "We couldn't send that application. Please try again." };
  }

  await sendApplicationReceivedEmail(applicant.name, job.title);

  revalidatePath(`/dashboard/recruiting/jobs/${parsed.data.job_id}`);
  revalidatePath("/dashboard/recruiting");
  revalidatePath("/admin/applications");
  return { success: "Application sent." };
}

const joinSchema = z.object({
  job_id: z.string().uuid(),
  accepted: z.literal("on", {
    error: "Tick the box to accept the guidelines.",
  }),
});

/**
 * Joining a campaign is instant: accept the guidelines and you're on it. No one
 * reviews it. A creator can't insert an assignment themselves (only admins can),
 * so the row is written here with the service role, after checking who is asking
 * and that the campaign is open. A campaign that asks for a sample video still
 * goes through an application, because someone has to watch the sample.
 */
export async function joinCampaignAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = joinSchema.safeParse({
    job_id: formData.get("job_id"),
    accepted: formData.get("accepted") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Something was off. Try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in to join." };

  // RLS: a creator can only read their own profile row.
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!applicant)
    return { error: "Set up your profile before joining a campaign." };

  // Like "link an account" on ContentCircle: you need one account that's proven to be
  // yours before you can join, because that's where your views are counted.
  const { count: verified } = await supabase
    .from("applicant_handles")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", applicant.id)
    .not("verified_at", "is", null);
  if (!verified)
    return {
      error: "Connect one of your accounts first. Open Account, then Accounts.",
    };

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, sample_required, payout_amount, payout_terms")
    .eq("id", parsed.data.job_id)
    .maybeSingle();
  if (!job) return { error: "That campaign no longer exists." };
  if (job.status !== "open")
    return { error: "This campaign isn't open any more." };
  if (job.sample_required) {
    return {
      error:
        "This campaign asks for a sample video, so you apply for it instead.",
    };
  }

  const { data: existing } = await supabase
    .from("assignments")
    .select("id")
    .eq("applicant_id", applicant.id)
    .eq("job_id", job.id)
    .maybeSingle();
  if (existing) return { success: "You're already on this campaign." };

  // Starting amount: the formula at zero views (the fixed fee, if any) or the
  // campaign's flat amount. The statement is worked out from real views later.
  const terms = parsePayoutTerms(job.payout_terms);
  const amount = terms
    ? calculatePayout(terms, 0).total
    : Number(job.payout_amount ?? 0);

  const { error } = await createAdminClient().from("assignments").insert({
    job_id: job.id,
    applicant_id: applicant.id,
    applicant_payout_amount: amount,
    status: "active",
  });
  if (error) {
    if (error.code === "23505")
      return { success: "You're already on this campaign." };
    return { error: "We couldn't add you to this campaign. Please try again." };
  }

  revalidatePath(`/dashboard/recruiting/jobs/${job.id}`);
  revalidatePath("/dashboard/recruiting");
  revalidatePath("/dashboard/recruiting/submissions");
  revalidatePath("/admin/payouts");
  return { success: "You're in." };
}

const withdrawSchema = z.object({ application_id: z.string().uuid() });

export async function withdrawApplicationAction(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = withdrawSchema.safeParse({
    application_id: formData.get("application_id"),
  });

  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();

  // RLS scopes this to the caller's own row, and the DB trigger allows only
  // pending -> withdrawn for non-admins.
  const { error } = await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", parsed.data.application_id);

  if (error) {
    return { error: "We couldn't withdraw that. Please try again." };
  }

  revalidatePath("/dashboard/recruiting");
  revalidatePath("/admin/applications");
  return { success: "Application withdrawn." };
}

/**
 * A creator hands in one post on a campaign paid per video. It is checked (their own
 * verified account, published after they joined, not used before), stored, and its
 * views start counting. See lib/post-tracking.ts.
 */
export async function submitPostAction(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const parsed = z
    .object({
      assignment_id: z.string().uuid(),
      post_url: z.string().trim().min(1, "Paste the link to your post.").max(500),
      repost_of: z.string().uuid().optional().or(z.literal("")),
    })
    .safeParse({
      assignment_id: formData.get("assignment_id"),
      post_url: formData.get("post_url"),
      repost_of: (formData.get("repost_of") as string) || "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Paste the link to your post." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const result = await submitPost(user.id, parsed.data.assignment_id, parsed.data.post_url, parsed.data.repost_of || null);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/recruiting/jobs", "layout");
  revalidatePath("/dashboard/recruiting/submissions");
  revalidatePath("/admin/statements");
  return { success: result.message };
}
