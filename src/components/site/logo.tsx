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
 * THE WORDMARK. "OnCamera" — one word, not "On Camera" — currently
 * trying Bespoke Stencil at its real Bold (700) cut. See layout.tsx's
 * `stencil` font for why this is `next/font/local` (Bespoke isn't on
 * Google Fonts) and why it's its own `--font-stencil` variable rather
 * than reusing `--font-brand` (Fjalla One, still what brand-tag.tsx
 * uses) or `--font-wordmark` (Bricolage Grotesque, still the hero
 * h1/chapter headings). A real named weight, not a synthesized one —
 * no text-stroke workaround needed the way Fjalla One's single 400 cut
 * required.
 *
 * One word rather than two: a logotype standing next to a mark reads
 * as a single designed unit that way (YouTube, PayPal, GoPro) rather
 * than a plain two-word label — the capital C still marks the word
 * boundary clearly with no space needed. The name and the mark beside
 * it are ours; the letterforms are the one thing here that
 * deliberately isn't.
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
      aria-label="OnCamera — home"
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
        <span className="font-stencil text-[1.15rem] leading-none text-foreground">
          OnCamera
        </span>
      )}
    </Link>
  );
}
