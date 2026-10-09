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
import { parsePostTerms } from "@/lib/post-terms";
import { contractStatus } from "@/lib/contract";

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
    .select("id, status, sample_required, payout_amount, payout_terms, post_terms")
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

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("assignments")
    .insert({
      job_id: job.id,
      applicant_id: applicant.id,
      applicant_payout_amount: amount,
      status: "active",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505")
      return { success: "You're already on this campaign." };
    return { error: "We couldn't add you to this campaign. Please try again." };
  }

  // The tick covered the brand's signed contract, if it has one: record that this creator agreed to it.
  // Not recorded (and not fatal) until migration 0025 has been run.
  const post = parsePostTerms(job.post_terms);
  if (created && post?.contract && contractStatus(post) === "signed") {
    const { error: recordError } = await (admin as unknown as { from: (n: string) => ReturnType<typeof admin.from> })
      .from("contract_acceptances")
      .insert({
        assignment_id: created.id,
        job_id: job.id,
        applicant_id: applicant.id,
        contract_agreed_at: post.contract.agreedAt,
      } as never);
    if (recordError) console.warn("contract acceptance not recorded:", recordError.message);
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
    .object({ assignment_id: z.string().uuid(), post_url: z.string().trim().min(1, "Paste the link to your post.").max(500) })
    .safeParse({ assignment_id: formData.get("assignment_id"), post_url: formData.get("post_url") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Paste the link to your post." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const result = await submitPost(user.id, parsed.data.assignment_id, parsed.data.post_url);
  if (!result.ok) return { error: result.error };

  revalidatePath("/dashboard/recruiting/jobs", "layout");
  revalidatePath("/dashboard/recruiting/submissions");
  revalidatePath("/admin/statements");
  return { success: result.message };
}

const agreeSchema = z.object({ assignment_id: z.string().uuid() });

/**
 * A creator who is already on a campaign agrees to the brand's contract (when the brand has signed it, or has changed
 * the pay terms since the creator last agreed). Recorded against their own assignment, which is proved first by reading
 * it as them (RLS); the write uses the service role.
 */
export async function agreeToContractAction(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const parsed = agreeSchema.safeParse({ assignment_id: formData.get("assignment_id") });
  if (!parsed.success) return { error: "Something was off. Try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  // RLS: a creator only sees their own assignments.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, job_id, applicant_id")
    .eq("id", parsed.data.assignment_id)
    .maybeSingle();
  if (!assignment) return { error: "We couldn't find your place on that campaign." };

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("post_terms").eq("id", assignment.job_id).maybeSingle();
  const post = job ? parsePostTerms(job.post_terms) : null;
  if (!post?.contract || contractStatus(post) !== "signed") return { error: "The brand hasn't signed this contract yet." };

  const { error } = await (admin as unknown as { from: (n: string) => ReturnType<typeof admin.from> })
    .from("contract_acceptances")
    .upsert(
      {
        assignment_id: assignment.id,
        job_id: assignment.job_id,
        applicant_id: assignment.applicant_id,
        accepted_at: new Date().toISOString(),
        contract_agreed_at: post.contract.agreedAt,
      } as never,
      { onConflict: "assignment_id" },
    );
  if (error) return { error: "We couldn't save that yet. Please try again later." };

  revalidatePath(`/dashboard/recruiting/jobs/${assignment.job_id}`);
  revalidatePath("/admin", "layout");
  return { success: "Thanks, you agreed to the contract." };
}
