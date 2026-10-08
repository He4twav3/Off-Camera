import { AVATAR_MAX_BYTES, avatarPathFromUrl, checkAvatarFile, sniffImageType } from "../src/lib/avatar";

let bad = 0;
const t = (n: string, ok: boolean, got?: unknown) => {
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", n, ok ? "" : JSON.stringify(got));
};

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const html = new TextEncoder().encode("<html><script>alert(1)</script>");
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

t("PNG is recognised", sniffImageType(png) === "png");
t("JPEG is recognised", sniffImageType(jpg) === "jpg");
t("GIF is recognised", sniffImageType(gif) === "gif");
t("WebP is recognised", sniffImageType(webp) === "webp");
t("SVG is refused (it can carry script)", sniffImageType(svg) === null);
t("HTML renamed to .png is refused", sniffImageType(html) === null);
t("a program is refused", sniffImageType(exe) === null);
t("an empty file is refused", sniffImageType(new Uint8Array()) === null);
t("RIFF that is not WebP is refused", sniffImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20])) === null);

t("a normal picture passes", checkAvatarFile(500_000, png).ok === true);
t("exactly 2 MB passes", checkAvatarFile(AVATAR_MAX_BYTES, png).ok === true);
t("over 2 MB is refused", checkAvatarFile(AVATAR_MAX_BYTES + 1, png).ok === false);
t("a zero-byte file is refused", checkAvatarFile(0, png).ok === false);
t("the size check comes first", (checkAvatarFile(AVATAR_MAX_BYTES + 1, svg) as { error: string }).error.includes("2 MB"));



t("the file path comes out of a public link", avatarPathFromUrl("https://x.supabase.co/storage/v1/object/public/avatars/u1/a.png") === "u1/a.png");
t("a link to somewhere else gives nothing", avatarPathFromUrl("https://evil.com/a.png") === null);
t("null gives nothing", avatarPathFromUrl(null) === null);
t("a campaign logo's path comes out of its own folder", avatarPathFromUrl("https://x.supabase.co/storage/v1/object/public/campaign-logos/abc.png", "campaign-logos") === "abc.png");
t("a profile picture link is not a campaign logo", avatarPathFromUrl("https://x.supabase.co/storage/v1/object/public/avatars/u1/a.png", "campaign-logos") === null);
t("the messages can say logo", (checkAvatarFile(AVATAR_MAX_BYTES + 1, png, "logo") as { error: string }).error === "That logo is over 2 MB. Choose a smaller one." && (checkAvatarFile(10, svg, "logo") as { error: string }).error.endsWith("logo."));

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
