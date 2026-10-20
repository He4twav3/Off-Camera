"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EXAMPLE_VIDEO_BUCKET, EXAMPLE_VIDEO_TYPES, MAX_EXAMPLE_VIDEO_BYTES } from "@/lib/example-videos";

export type ExampleUploadStart = { ok: true; path: string; token: string; url: string } | { ok: false; error: string };

/**
 * Hands the browser a one-time signed upload for an example video. The file goes straight from the browser to
 * storage: a video is far bigger than a Server Action will accept. Only admins and brands may upload.
 */
export async function startExampleUploadAction(input: { type: string; size: number }): Promise<ExampleUploadStart> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in again to upload a video." };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    // RLS: a user can only read their own brand account.
    const { data: brand } = await supabase.from("brand_accounts").select("id").eq("user_id", user.id).maybeSingle();
    if (!brand) return { ok: false, error: "Only brands and admins can add example videos." };
  }

  const ext = EXAMPLE_VIDEO_TYPES[input.type];
  if (!ext) return { ok: false, error: "Use an MP4, MOV or WebM video." };
  if (!(input.size > 0) || input.size > MAX_EXAMPLE_VIDEO_BYTES) return { ok: false, error: "Keep each video under 50 MB." };

  const storage = createAdminClient().storage;
  // The bucket is made on first use, so no setup step is needed in Supabase.
  const { data: bucket } = await storage.getBucket(EXAMPLE_VIDEO_BUCKET);
  if (!bucket) {
    const { error } = await storage.createBucket(EXAMPLE_VIDEO_BUCKET, {
      public: true,
      fileSizeLimit: MAX_EXAMPLE_VIDEO_BYTES,
      allowedMimeTypes: Object.keys(EXAMPLE_VIDEO_TYPES),
    });
    if (error && !/exist/i.test(error.message)) {
      console.error("example-videos: couldn't create the bucket:", error.message);
      return { ok: false, error: "Uploads aren't available right now. Please try again later." };
    }
  }

  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await storage.from(EXAMPLE_VIDEO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("example-videos: couldn't sign the upload:", error?.message);
    return { ok: false, error: "We couldn't start the upload. Please try again." };
  }
  return { ok: true, path: data.path, token: data.token, url: storage.from(EXAMPLE_VIDEO_BUCKET).getPublicUrl(data.path).data.publicUrl };
}
