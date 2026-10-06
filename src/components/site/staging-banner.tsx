import { isStaging } from "@/lib/environment";

/** A bar across the top of every page on the staging copy, so nobody mistakes it for the live site. */
export function StagingBanner() {
  if (!isStaging()) return null;
  return (
    <div
      role="note"
      className="sticky top-0 z-[100] bg-amber-400 px-4 py-1.5 text-center text-xs font-bold tracking-wide text-black"
    >
      STAGING: a test copy. Not the live site. Don&apos;t use real information.
    </div>
  );
}
