import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site-config";

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
