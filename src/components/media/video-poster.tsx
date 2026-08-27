import { cn } from "@/lib/utils";

/**
 * Placeholder standing in for a real video frame. Swap for a real poster
 * image later — same slot, same aspect ratio.
 *
 * Was a flat fill, which matched the old hard-outline sticker system.
 * Under the landing page's depth system a flat rectangle is the one
 * thing that reads as a hole in the page, so each variant is a soft
 * vertical gradient across the surface ramp instead — the same "lit from
 * above" story every other surface tells.
 */
export function VideoPoster({
  variant = "primary",
  className,
  children,
}: {
  variant?: "primary" | "muted" | "dark";
  className?: string;
  children?: React.ReactNode;
}) {
  const variants = {
    primary:
      "bg-gradient-to-b from-crimson to-crimson-deep text-cta-foreground",
    muted: "bg-gradient-to-b from-surface-3 to-surface-1 text-foreground",
    dark: "bg-gradient-to-b from-surface-2 to-surface-0 text-foreground",
  };

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center p-6",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
