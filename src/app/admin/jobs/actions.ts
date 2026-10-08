"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_CONTENT_TYPES,
  avatarPathFromUrl,
  checkAvatarFile,
} from "@/lib/avatar";
import { payoutTermsSchema } from "@/lib/payout-terms";
import { parseExampleLinks, parseLines } from "@/lib/campaign-brief";

export interface JobFormState {
  error?: string;
  success?: string;
}

const jobSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Give the job a title.").max(200),
  description: z.string().trim().max(5000).optional(),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts", "x"]),
  niche_id: z.string().uuid("Pick a niche."),
  payout_type: z.enum(["flat", "cpm", "retainer"]),
  payout_amount: z.coerce.number().min(0, "Payout can't be negative."),
  payout_notes: z.string().trim().max(500).optional(),
  account_requirement: z.enum(["new_ok", "established_required"]),
  status: z.enum(["open", "filled", "closed"]),
  brand_account_id: z.string().uuid().optional().or(z.literal("")),
  sample_criteria: z.string().trim().max(1000).optional(),
  about: z
    .string()
    .trim()
    .max(2000, "Keep the brand note under 2,000 characters.")
    .optional(),
  // Optional affiliate link from the brand (most make theirs in Dub). Any https
  // link, so Dub's own domains and brands' custom domains both work.
  affiliate_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || /^https:\/\/[^\s]+$/i.test(v),
      "Affiliate link must be a full URL starting with https://",
    )
    .optional(),
  notion_sop_url: z
    .string()
    .trim()
    .url("Enter a full URL, starting with https://")
    .optional()
    .or(z.literal("")),
});

/** Reads the payout-formula fields of the job form. Returns null terms when none
 * of the parts are filled in (the campaign then uses the plain payout fields). */
function readPayoutTerms(formData: FormData): {
  terms: Record<string, unknown> | null;
  error?: string;
} {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string): number | null | "bad" => {
    const t = text(k);
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : "bad";
  };
  const read = (k: string, label: string) => {
    const n = num(k);
    if (n === "bad") throw new Error(`${label} must be a number.`);
    return n;
  };

  try {
    const fixed = read("fixed_per_video", "Fixed fee") ?? 0;
    const videos = read("videos", "Videos") ?? 1;
    const cpmRate = read("cpm_rate", "Rate per 1,000 views");
    const cpmStart = read("cpm_starts_at", "Views before the rate starts") ?? 0;
    const cap = read("cap_per_creator", "Maximum payout");
    const days = read("measure_days", "Measurement days") ?? 30;

    const bonuses: { views: number; amount: number }[] = [];
    for (const i of [1, 2, 3]) {
      const views = read(`bonus${i}_views`, `Bonus ${i} views`);
      const amount = read(`bonus${i}_amount`, `Bonus ${i} amount`);
      if (views === null && amount === null) continue;
      if (views === null || amount === null)
        throw new Error(
          `Fill in both the views and the amount for bonus ${i}, or leave both empty.`,
        );
      bonuses.push({ views, amount });
    }

    const any =
      fixed > 0 || (cpmRate !== null && cpmRate > 0) || bonuses.length > 0;
    if (!any) return { terms: null };

    const parsed = payoutTermsSchema.safeParse({
      v: 1,
      videos,
      fixedPerVideo: fixed,
      cpm:
        cpmRate !== null && cpmRate > 0
          ? {
              ratePer1000: cpmRate,
              startsAt: Math.max(0, Math.floor(cpmStart)),
            }
          : null,
      bonuses,
      capPerCreator: cap !== null && cap > 0 ? cap : null,
      measureDays: days,
      fixedPaidOn: text("fixed_paid_on") === "end" ? "end" : "approval",
    });
    if (!parsed.success)
      return {
        terms: null,
        error: parsed.error.issues[0]?.message ?? "Check the payout formula.",
      };
    return { terms: parsed.data };
  } catch (e) {
    return { terms: null, error: (e as Error).message };
  }
}

export async function saveJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  // A new niche typed into the form is created (or found, if it already exists) and used
  // instead of the one picked in the list. Admins only: the database enforces that.
  let nicheId = formData.get("niche_id");
  const newNiche = String(formData.get("new_niche") ?? "").trim().slice(0, 40);
  if (newNiche) {
    const slug = newNiche
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug) return { error: "Give the niche a name with letters or numbers." };
    const nicheDb = await createClient();
    const { data: found } = await nicheDb
      .from("niches")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (found) {
      nicheId = found.id;
    } else {
      const { data: made, error: nicheError } = await nicheDb
        .from("niches")
        .insert({ slug, label: newNiche })
        .select("id")
        .single();
      if (nicheError || !made)
        return { error: "We couldn't add that niche. Please try again." };
      nicheId = made.id;
    }
  }

  const parsed = jobSchema.safeParse({
    id: (formData.get("id") as string) || "",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    platform: formData.get("platform"),
    niche_id: nicheId,
    payout_type: formData.get("payout_type"),
    payout_amount: formData.get("payout_amount"),
    payout_notes: formData.get("payout_notes") ?? "",
    account_requirement: formData.get("account_requirement"),
    status: formData.get("status"),
    brand_account_id: (formData.get("brand_account_id") as string) || "",
    notion_sop_url: formData.get("notion_sop_url") ?? "",
    about: formData.get("about") ?? "",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the job fields.",
    };
  }

  // What the brand says on the campaign page: formats that work, and example videos.
  const formatLines = parseLines(String(formData.get("formats") ?? ""));
  if (!formatLines.ok)
    return { error: `Formats that work: ${formatLines.error}` };
  const examples = parseExampleLinks(
    String(formData.get("example_urls") ?? ""),
  );
  if (!examples.ok) return { error: `Example videos: ${examples.error}` };

  const formula = readPayoutTerms(formData);
  if (formula.error) return { error: formula.error };

  const supabase = await createClient();
  const { id, ...values } = parsed.data;

  const row = {
    ...values,
    description: values.description ?? "",
    payout_notes: values.payout_notes || null,
    notion_sop_url: values.notion_sop_url || null,
    brand_account_id: values.brand_account_id || null,
    payout_terms: formula.terms,
    // Off unless the box is ticked: most campaigns are a normal application.
    sample_required: formData.get("sample_required") === "on",
    sample_criteria: values.sample_criteria || null,
    affiliate_url: values.affiliate_url || null,
    about: values.about || null,
    formats: formatLines.lines.length ? formatLines.lines.join("\n") : null,
    example_urls: examples.urls,
  };

  // The campaign's logo. Uploaded as the signed-in admin: the storage rules only let an
  // admin (after two-step sign-in) write to the logos folder. What the file really is
  // comes from its bytes, not its name.
  let logoUrl: string | null | undefined; // undefined = leave as it is
  let oldLogoPath: string | null = null;
  if (id) {
    const { data: current } = await supabase
      .from("jobs")
      .select("logo_url")
      .eq("id", id)
      .maybeSingle();
    oldLogoPath = avatarPathFromUrl(
      current?.logo_url ?? null,
      "campaign-logos",
    );
  }
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = checkAvatarFile(file.size, bytes, "logo");
    if (!checked.ok) return { error: checked.error };
    if (checked.type === "gif")
      return { error: "Use a JPG, PNG or WebP logo." };
    const path = `${crypto.randomUUID()}.${checked.type}`;
    const { error: uploadError } = await supabase.storage
      .from("campaign-logos")
      .upload(path, bytes, {
        contentType: AVATAR_CONTENT_TYPES[checked.type],
        upsert: false,
      });
    if (uploadError)
      return { error: "We couldn't upload that logo. Please try again." };
    logoUrl = supabase.storage.from("campaign-logos").getPublicUrl(path)
      .data.publicUrl;
  } else if (formData.get("remove_logo") === "on") {
    logoUrl = null;
  }

  // RLS restricts writes to admins; this runs as the signed-in admin, not
  // service-role, so the policy is doing the real enforcement.
  const saved: typeof row & { logo_url?: string | null } =
    logoUrl === undefined ? row : { ...row, logo_url: logoUrl };
  const { error } = id
    ? await supabase.from("jobs").update(saved).eq("id", id)
    : await supabase.from("jobs").insert(saved);

  if (error) {
    return { error: "Couldn't save the job. Please try again." };
  }

  // The logo it replaced is no longer used. Failing to tidy it up is harmless.
  if (oldLogoPath && logoUrl !== undefined)
    await supabase.storage.from("campaign-logos").remove([oldLogoPath]);

  revalidatePath("/admin/jobs");
  revalidatePath("/dashboard/recruiting/jobs");
  revalidatePath("/brand");
  return { success: id ? "Job updated." : "Job created." };
}

export async function deleteJobAction(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("jobs").delete().eq("id", id);

  revalidatePath("/admin/jobs");
  revalidatePath("/dashboard/recruiting/jobs");
}
