import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The wordmark: the name set lowercase and tight, with the tally light
 * after it.
 *
 * BUILT TO THE REFERENCE SITE'S SPEC, WHICH WAS MEASURED RATHER THAN
 * EYEBALLED. Its logo is a pure lowercase wordmark — no symbol, no tile,
 * no lockup — and the numbers below came out of its actual pixels:
 *
 *   stem / x-height   = 0.258  → Bold, 700. Notably heavier than the
 *                                500–600 the rest of the display type
 *                                runs at; a wordmark is set heavier than
 *                                the headings it sits above, and that
 *                                contrast is what makes it read as a mark
 *                                rather than as a line of copy.
 *   letter gap / stem = 0.5    → tracking pulled tight and negative. At
 *                                this weight the counters carry the
 *                                spacing, so the letters can close up.
 *   lowercase throughout       → no capitals anywhere in it.
 *
 * WHAT IS OURS. The construction is adapted; nothing is copied. Their
 * name is set in their letterforms — this is our name in DM Sans, and the
 * one element they do not have is the thing that makes it ours: a
 * camera's tally light, the red lamp that means the thing is recording,
 * sitting where a full stop would. It is as close to a literal reading of
 * "Off Camera" as a mark can get, and it is the only animated element in
 * the site's chrome. It pulses for the same reason a real tally does — it
 * reads as live rather than as decoration.
 *
 * The red is the brand crimson, not --destructive. --destructive is the
 * error colour, and this site has exactly one red in it: the same one on
 * the CTA, the module ramp and the countdown's live dot.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Off Camera — home"
      className={cn(
        "focus-premium group/logo inline-flex items-baseline gap-[0.3em] rounded-md py-1",
        // Everything from here down is sized in em, so the whole lockup —
        // the gap and the tally included — scales as one object if a
        // caller changes the text size.
        "font-heading text-[1.15rem] leading-none font-bold lowercase",
        "tracking-[-0.03em] text-foreground",
        className
      )}
    >
      off camera
      {/* The tally, on the baseline where a full stop would sit. */}
      <span className="relative inline-flex size-[0.24em] shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-crimson-bright/70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-full rounded-full bg-crimson-bright shadow-[0_0_10px_-1px_oklch(0.55_0.205_29_/_0.85)] transition-transform duration-300 ease-[var(--ease-cinematic)] group-hover/logo:scale-125" />
      </span>
    </Link>
  );
}
