"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normaliseHandle } from "@/lib/handles";
import {
  AVATAR_CONTENT_TYPES,
  avatarPathFromUrl,
  checkAvatarFile,
} from "@/lib/avatar";
import type { PlatformEnum } from "@/lib/database.types";

export interface AccountState {
  error?: string;
  success?: string;
}

const PLATFORMS = ["tiktok", "instagram", "youtube_shorts", "x"] as const;
const MAX_ACCOUNTS = 8;

function refresh() {
  revalidatePath("/dashboard", "layout");
}

/** The signed-in creator's own profile row (RLS: only theirs), or null. */
async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, applicant: null };
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, user, applicant };
}

// --- profile picture ---------------------------------------------------------

export async function uploadAvatarAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const { supabase, user, applicant } = await me();
  if (!user) return { error: "You need to be logged in." };
  if (!applicant)
    return { error: "Save your profile first, then add a picture." };

  const file = formData.get("avatar");
  if (!(file instanceof File)) return { error: "Choose a picture to upload." };

  // What the file really is comes from its bytes, never its name or claimed type.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = checkAvatarFile(file.size, bytes);
  if (!checked.ok) return { error: checked.error };

  // A new random name each time, inside the creator's own folder (the storage
  // rules only allow writes there), so a changed picture is never served stale.
  const path = `${user.id}/${crypto.randomUUID()}.${checked.type}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, {
      contentType: AVATAR_CONTENT_TYPES[checked.type],
      upsert: false,
    });
  if (uploadError)
    return { error: "We couldn't upload that picture. Please try again." };

  const url = supabase.storage.from("avatars").getPublicUrl(path)
    .data.publicUrl;
  const { error } = await supabase
    .from("applicants")
    .update({ avatar_url: url })
    .eq("id", applicant.id);
  if (error) {
    await supabase.storage.from("avatars").remove([path]);
    return { error: "We couldn't save your picture. Please try again." };
  }

  // Tidy up the one it replaces. Failing to is harmless.
  const old = avatarPathFromUrl(applicant.avatar_url);
  if (old && old.startsWith(`${user.id}/`))
    await supabase.storage.from("avatars").remove([old]);

  refresh();
  return { success: "Picture updated." };
}

export async function removeAvatarAction(
  _prev: AccountState,
  _formData: FormData,
): Promise<AccountState> {
  void _formData;
  const { supabase, user, applicant } = await me();
  if (!user || !applicant) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("applicants")
    .update({ avatar_url: null })
    .eq("id", applicant.id);
  if (error)
    return { error: "We couldn't remove your picture. Please try again." };

  const old = avatarPathFromUrl(applicant.avatar_url);
  if (old && old.startsWith(`${user.id}/`))
    await supabase.storage.from("avatars").remove([old]);

  refresh();
  return { success: "Picture removed." };
}

// --- Discord ---------------------------------------------------------------------

export async function disconnectDiscordAction(
  _prev: AccountState,
  _formData: FormData,
): Promise<AccountState> {
  void _formData;
  const { user, applicant } = await me();
  if (!user || !applicant) return { error: "You need to be logged in." };

  // The database stops creators writing the Discord fields themselves, so the server does it.
  const { error } = await createAdminClient()
    .from("applicants")
    .update({ discord_id: null, discord_username: null })
    .eq("id", applicant.id);
  if (error) return { error: "We couldn't do that. Please try again." };

  refresh();
  return { success: "Discord disconnected." };
}

// --- accounts (handles) ---------------------------------------------------------

const addSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z
    .string()
    .trim()
    .min(1, "Enter your username on that platform.")
    .max(120),
});

export async function addAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = addSchema.safeParse({
    platform: formData.get("platform"),
    handle: formData.get("handle"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the account." };

  const { supabase, user, applicant } = await me();
  if (!user) return { error: "You need to be logged in." };
  if (!applicant)
    return { error: "Save your profile first, then add accounts." };

  const clean = normaliseHandle(
    parsed.data.handle,
    parsed.data.platform as PlatformEnum,
  );
  if (!clean.ok) return { error: clean.error ?? "Check the username." };

  const { count } = await supabase
    .from("applicant_handles")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", applicant.id);
  if ((count ?? 0) >= MAX_ACCOUNTS)
    return { error: `You can add up to ${MAX_ACCOUNTS} accounts.` };

  const { error } = await supabase.from("applicant_handles").insert({
    applicant_id: applicant.id,
    platform: parsed.data.platform,
    handle: clean.handle,
    profile_url: clean.profileUrl!,
    follower_count: null,
    is_primary: (count ?? 0) === 0,
  });
  if (error) {
    if (error.code === "23505")
      return { error: "That account is already on your profile." };
    return { error: "We couldn't add that account. Please try again." };
  }

  refresh();
  return { success: "Added. Now verify it so we know it's yours." };
}

export async function removeAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid request." };

  const { supabase, user, applicant } = await me();
  if (!user || !applicant) return { error: "You need to be logged in." };

  const { data: all } = await supabase
    .from("applicant_handles")
    .select("id, is_primary, created_at")
    .eq("applicant_id", applicant.id)
    .order("created_at", { ascending: true });
  const target = (all ?? []).find((h) => h.id === id.data);
  if (!target) return { error: "Account not found." };
  if ((all ?? []).length <= 1)
    return {
      error: "Keep at least one account. Add another before removing this one.",
    };

  const { error } = await supabase
    .from("applicant_handles")
    .delete()
    .eq("id", target.id);
  if (error)
    return { error: "We couldn't remove that account. Please try again." };

  // The main account is what campaigns are matched on, so another takes its place.
  if (target.is_primary) {
    const next = (all ?? []).find((h) => h.id !== target.id);
    if (next)
      await supabase
        .from("applicant_handles")
        .update({ is_primary: true })
        .eq("id", next.id);
  }

  refresh();
  return { success: "Removed." };
}
