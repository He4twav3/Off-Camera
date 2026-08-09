import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-sticker-sm flex items-center gap-2 font-heading text-lg font-bold tracking-tight",
        className
      )}
    >
      <span className="pill-outline inline-block size-3 rounded-full bg-primary" />
      Off Camera
    </Link>
  );
}
