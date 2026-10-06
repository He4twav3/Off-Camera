/**
 * Sample videos are shared as Google Drive links. This only checks that the link
 * really is a Google Drive file or folder link: it cannot see whether the file
 * is shared, so the apply form tells creators to set "Anyone with the link".
 * The link is stored exactly as pasted (some older links need their
 * `resourcekey` parameter to open).
 */
export type DriveLinkResult = { ok: true; url: string } | { ok: false; error: string };

const ID = "[A-Za-z0-9_-]{10,}";
const PATHS = [
  new RegExp(`^/file/d/${ID}(/|$)`),
  new RegExp(`^/drive/(u/\\d+/)?folders/${ID}(/|$)`),
  new RegExp(`^/folders/${ID}(/|$)`),
];

export function parseDriveLink(raw: string): DriveLinkResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Paste a Google Drive link." };
  if (text.length > 500) return { ok: false, error: "That link is too long." };

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That doesn't look like a link. Paste the full Google Drive link." };
  }
  if (url.protocol !== "https:" || url.hostname !== "drive.google.com") {
    return { ok: false, error: "Use a Google Drive link (it starts with https://drive.google.com)." };
  }
  const isFilePath = PATHS.some((re) => re.test(url.pathname));
  const isOpenId = (url.pathname === "/open" || url.pathname === "/uc") && new RegExp(`^${ID}$`).test(url.searchParams.get("id") ?? "");
  if (!isFilePath && !isOpenId) {
    return { ok: false, error: "That Drive link doesn't point to a file. Open the video in Drive, click Share, and copy the link." };
  }
  return { ok: true, url: url.toString() };
}
