import { cn } from "@/lib/utils";

// A campaign has no brand logo to show (the brand name is private until you join),
// so the banner carries what matters instead: the pay. The colour comes from the
// campaign's id, so each one looks its own and keeps the same colour every visit.
function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  // Scramble, so ids that differ by one character still land on very different colours.
  return Math.floor(((Math.imul(h + 1, 2654435761) >>> 0) / 4294967296) * 360);
}

export function CampaignBanner({
  seed,
  headline,
  caption,
  className,
}: {
  seed: string;
  headline: string;
  caption?: string;
  className?: string;
}) {
  const h = hueFor(seed);
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden px-4 text-center",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 45% 20%), hsl(${(h + 50) % 360} 55% 9%))`,
      }}
    >
      <div
        aria-hidden
        className="absolute -top-10 -right-10 size-40 rounded-full opacity-25 blur-2xl"
        style={{ background: `hsl(${(h + 20) % 360} 80% 55%)` }}
      />
      <p className="relative font-heading text-2xl leading-tight font-semibold text-white sm:text-3xl">
        {headline}
      </p>
      {caption && (
        <p className="relative mt-1.5 text-sm text-white/70">{caption}</p>
      )}
    </div>
  );
}
