import { cn } from "@/lib/utils";

/**
 * Flat-color placeholder standing in for a real video frame. Deliberately
 * no gradient — a solid tone reads cleaner against the rest of the site's
 * flat-fill/hard-outline system than a blended one does.
 * Swap for a real poster image later — same slot, same aspect ratio.
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
    primary: "bg-primary text-primary-foreground",
    muted: "bg-secondary text-foreground",
    dark: "bg-muted text-foreground",
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
