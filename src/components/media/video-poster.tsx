import { cn } from "@/lib/utils";

/**
 * Placeholder standing in for a real video frame. Swap for a real poster
 * image later — same slot, same aspect ratio.
 *
 * Plain black — the actual colour a video element shows before its first
 * frame has decoded, so this reads as "a video is about to play here"
 * rather than as a piece of the page's own decoration. It used to be a
 * soft brand-tinted gradient (and before that a flat sticker fill), both
 * of which looked like a designed surface rather than an absent video.
 */
export function VideoPoster({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-black p-6 text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
