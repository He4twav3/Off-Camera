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
 * THE WORDMARK. "ONCamera", set in Fjalla One — a condensed display
 * face, deliberately not the lowercase Bricolage Grotesque wordmark this
 * used to be (see layout.tsx's `brand` font for why it's a separate
 * variable from `--font-wordmark`, which still drives the hero h1 and
 * chapter headings unchanged). One weight only — 400, the one file
 * Fjalla One actually ships — which is not a compromise here: the face
 * reads bold/blocky at regular weight on its own, unlike Bricolage,
 * which needed 700 to hold up at this size. No tracking adjustment: this
 * is a condensed face by design, and pulling it tighter the way
 * Bricolage's wider proportions needed reads cramped rather than
 * confident. The name and the mark beside it are ours; the letterforms
 * are the one thing here that deliberately isn't.
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
      aria-label="ONCamera — home"
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
        <span className="font-brand text-[1.15rem] leading-none text-foreground">
          ONCamera
        </span>
      )}
    </Link>
  );
}
