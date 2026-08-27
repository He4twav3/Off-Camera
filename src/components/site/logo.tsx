import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";
import { cn } from "@/lib/utils";

/**
 * The logo: the viewfinder mark, then the name.
 *
 * TWO LOCKUPS, ONE IDENTITY.
 *   full     — mark + wordmark. The default, for the navbar, the footer
 *              and every auth/checkout page header.
 *   compact  — the mark alone, for anywhere too tight for the name. It
 *              is not a cropped version of the full lockup; the mark was
 *              drawn to stand on its own (see brand-mark.tsx), which is
 *              the whole reason the identity is a mark plus a name rather
 *              than a wordmark with a decorative flourish in it.
 *
 * THE MARK IS OURS AND UNTOUCHED — see brand-mark.tsx. Everything below
 * is about the letters that follow it.
 *
 * THE WORDMARK. Lowercase, set tight, in Bricolage Grotesque — the same
 * face the reference site's own oversized "Parley" lettering measures out
 * to (see layout.tsx for how that was confirmed; it is not their heading
 * face). Tracking -0.04em is read off that same source. The weight is
 * not — 500 is what their oversized lettering measures to, but at this
 * size (1.15rem) that reads thin rather than confident, so this is set
 * at 700 instead, which is both closer to how their own small lettering
 * actually looks and the ordinary fix for a face needing more weight in
 * hand the smaller it's set. What made a plain lowercase wordmark read
 * as a mark instead of a line of text either way is less the weight than
 * the huge x-height this face has relative to its cap-height (0.82)
 * closing the gap between the capital-less lowercase letters and a
 * full-height line of text, plus tracking pulled tight enough that the
 * counters, not the gaps, carry the spacing. The name and the mark
 * beside it are ours; the letterforms are the one thing here that is
 * deliberately not.
 *
 * NO MOSAIC HERE. The oversized lettering in footer-wordmark.tsx carries
 * one; this doesn't. At 1.15rem there's barely a word to interrupt, and
 * every version of that tried at this size read as noise on the primary
 * navigation mark rather than a detail — the one place on the page a
 * broken-looking wordmark actually costs something.
 */
export function Logo({
  className,
  variant = "full",
}: {
  className?: string;
  variant?: "full" | "compact";
}) {
  return (
    <Link
      href="/"
      aria-label="Off Camera — home"
      className={cn(
        "focus-premium group/logo inline-flex items-center gap-2 rounded-md",
        className
      )}
    >
      <BrandMark
        live
        className="size-[1.35em] text-foreground/85 transition-colors duration-300 ease-[var(--ease-cinematic)] group-hover/logo:text-foreground"
      />
      {variant === "full" && (
        <span className="font-wordmark text-[1.15rem] leading-none font-bold lowercase tracking-[-0.04em] text-foreground">
          off camera
        </span>
      )}
    </Link>
  );
}
