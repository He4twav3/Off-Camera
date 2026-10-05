import { Megaphone } from "lucide-react";

/**
 * The paid-post disclosure rule, shown on every campaign. Posts made for a brand
 * are paid promotion, and the platforms and advertising rules expect that to be
 * labelled. Creators must also tick a confirmation when they submit a post
 * (see ProofForm / submitProofAction).
 */
export function DisclosureNotice({ className }: { className?: string }) {
  return (
    <div className={`rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed ${className ?? ""}`}>
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <Megaphone size={16} /> Label every post as a paid partnership
      </p>
      <p className="mt-1.5 text-muted-foreground">
        Use the platform&apos;s paid-partnership label (TikTok&apos;s &ldquo;Content disclosure&rdquo; setting,
        Instagram&apos;s &ldquo;Paid partnership&rdquo; label, YouTube&apos;s &ldquo;Includes paid promotion&rdquo; box), or
        put <strong className="text-foreground">#ad</strong> clearly at the start of the caption. Posts
        that aren&apos;t labelled can be removed and may not be paid.
      </p>
    </div>
  );
}
