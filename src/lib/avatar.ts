/**
 * Profile pictures: pure checks (no server imports) so the
 * form, the server actions and the tests can share them. Mirrored in the
 * database (0022) and the avatars bucket (2 MB, images only).
 */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export type AvatarType = "jpg" | "png" | "gif" | "webp";

export const AVATAR_CONTENT_TYPES: Record<AvatarType, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * What a file really is, from its first bytes. A file's name and its claimed
 * type are set by whoever sends it, so neither is trusted.
 */
export function sniffImageType(bytes: Uint8Array): AvatarType | null {
  const at = (i: number) => bytes[i] ?? -1;
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "jpg";
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47)
    return "png";
  if (at(0) === 0x47 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x38)
    return "gif";
  // WebP: "RIFF" ... "WEBP"
  if (
    at(0) === 0x52 &&
    at(1) === 0x49 &&
    at(2) === 0x46 &&
    at(3) === 0x46 &&
    at(8) === 0x57 &&
    at(9) === 0x45 &&
    at(10) === 0x42 &&
    at(11) === 0x50
  ) {
    return "webp";
  }
  return null;
}

export type AvatarCheck =
  { ok: true; type: AvatarType } | { ok: false; error: string };

export function checkAvatarFile(size: number, bytes: Uint8Array, noun = "picture"): AvatarCheck {
  if (size <= 0) return { ok: false, error: `Choose a ${noun} to upload.` };
  if (size > AVATAR_MAX_BYTES)
    return {
      ok: false,
      error: `That ${noun} is over 2 MB. Choose a smaller one.`,
    };
  const type = sniffImageType(bytes);
  if (!type)
    return { ok: false, error: `Use a JPG, PNG, GIF or WebP ${noun}.` };
  return { ok: true, type };
}

/** The file path inside the avatars bucket for a public picture link, or null for anything else. */
export function avatarPathFromUrl(url: string | null, bucket = "avatars"): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length).split("?")[0];
  return path || null;
}
