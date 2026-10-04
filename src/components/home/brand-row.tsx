/* eslint-disable @next/next/no-img-element */
import { BRANDS } from "@/lib/brands";
import { Reveal } from "@/components/marketing/reveal";

/** A plain row of the brands we've made content for (real logos only). */
export function BrandRow() {
  const brands = BRANDS.filter((b) => b.logo);
  if (brands.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-14 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-center text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          We&rsquo;ve made content for
        </p>
        <ul className="mt-7 flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
          {brands.map((b) => (
            <li key={b.name} className="flex w-20 flex-col items-center gap-2">
              <span
                className={
                  "flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-hairline " +
                  (b.tone === "tile" ? "" : "bg-white p-2")
                }
              >
                <img
                  src={b.logo}
                  alt=""
                  className={b.tone === "tile" ? "size-full object-cover" : "max-h-full max-w-full object-contain"}
                  loading="lazy"
                />
              </span>
              <span className="text-center text-xs text-muted-foreground">{b.name}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
