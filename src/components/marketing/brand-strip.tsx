const categories = [
  "Skincare & beauty",
  "Fitness apps",
  "Mobile games",
  "Food & beverage",
  "DTC gadgets",
  "SaaS apps",
];

export function BrandStrip() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <p className="text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        The kinds of brands this works for
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {categories.map((category) => (
          <span
            key={category}
            className="pill-outline rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold"
          >
            {category}
          </span>
        ))}
      </div>
    </div>
  );
}
