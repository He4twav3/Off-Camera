const stats = [
  { value: "$180K+", label: "earned by students in brand deals", variant: "soft" },
  { value: "3.2M+", label: "combined views on faceless content", variant: "base" },
  { value: "80+", label: "brand campaigns completed", variant: "strong" },
  { value: "500+", label: "students taught", variant: "deep" },
  { value: "$0", label: "spent on camera gear", variant: "soft" },
] as const;

const VARIANTS = {
  soft: "bg-toy-soft text-toy-soft-foreground",
  base: "bg-toy-base text-toy-base-foreground",
  strong: "bg-toy-strong text-toy-strong-foreground",
  deep: "bg-toy-deep text-toy-deep-foreground",
};

export function Stats() {
  return (
    <section className="border-y-[3px] border-ink bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`pill-outline w-40 rounded-2xl px-4 py-4 text-center ${VARIANTS[stat.variant]}`}
            >
              <p className="font-heading text-3xl font-semibold sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium opacity-80 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Built for TikTok · Instagram Reels · YouTube Shorts
        </p>
      </div>
    </section>
  );
}
