import type { ComponentType } from "react";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
  SnapchatIcon,
  ThreadsIcon,
} from "@/components/marketing/platform-icons";

/**
 * The platforms creators already post to — data behind the "familiar
 * platforms" marquee rows (marketing/platform-familiarity.tsx).
 *
 * Deliberately separate from lib/brands.ts's BRANDS: those are companies
 * On Camera made content *for* (third-party validation); these are the
 * apps a visitor already has installed and knows how to use (familiarity,
 * not endorsement). Order is the display order, not a ranking.
 *
 * No `tone` field any more — every mark here now renders on the exact
 * same neutral disc at the exact same inset (see PlatformBadge), which
 * is what actually fixed the "inconsistently sized" complaint a
 * per-platform tile/onDark split produced. Each icon's own SVG carries
 * its real colour directly (platform-icons.tsx) instead of the badge
 * choosing a background per platform.
 */
export type Platform = {
  name: string;
  icon: ComponentType<{ className?: string }>;
};

export const PLATFORMS: Platform[] = [
  { name: "TikTok", icon: TikTokIcon },
  { name: "Instagram", icon: InstagramIcon },
  { name: "YouTube", icon: YouTubeIcon },
  { name: "Snapchat", icon: SnapchatIcon },
  { name: "Threads", icon: ThreadsIcon },
];
