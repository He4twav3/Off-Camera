import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site-config";

/**
 * The real Discord mark (Clyde), not a generic chat-bubble stand-in —
 * every CTA that actually says "Discord" should be identifiable at a
 * glance before anyone reads the word. One inline `<svg>`, not an image
 * asset: no file to add to `public/`, scales cleanly at any size, and
 * `fill="currentColor"` means it inherits whatever color the button
 * text around it already uses instead of carrying its own baked-in
 * brand-blurple fill that would fight this site's own palette. Path
 * data is the standard simple-icons Discord glyph (CC0), same one most
 * sites reach for.
 */
export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c1.7141 1.2604 3.3763 2.0287 5.0122 2.516a.0776.0776 0 0 0 .0842-.0276c.4288-.5865.8115-1.2029 1.1454-1.8517a.076.076 0 0 0-.0416-.1057c-.6099-.2314-1.1907-.5119-1.7466-.8383a.077.077 0 0 1-.0076-.1277c.1173-.0878.2346-.1793.3468-.2717a.0742.0742 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1122.0925.2295.1848.3477.2727a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.7477.8384.0766.0766 0 0 0-.0407.1067c.3436.6486.7263.9622 1.1454 1.8517a.076.076 0 0 0 .0842.0276c1.6389-.4873 3.3011-1.2556 5.0122-2.516a.0824.0824 0 0 0 .0312-.0546c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1826 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.419-2.1568 2.419zm7.9748 0c-1.1826 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
    </svg>
  );
}

/**
 * Every "contact us" touchpoint on the site (legal pages, About, footer,
 * FAQ) reads this instead of a mailto address — support runs through
 * Discord now, not email. Same honesty rule as siteConfig.communityUrl's
 * own note: renders a real link once a real invite exists, plain text
 * otherwise, rather than linking somewhere fake. The moment a real invite
 * link is set on siteConfig, every one of these lights up together.
 */
export function DiscordLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!siteConfig.communityUrl) return <>{children}</>;
  return (
    <a
      href={siteConfig.communityUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
