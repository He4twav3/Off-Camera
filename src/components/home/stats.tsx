import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";
import { CountUp } from "./count-up";

/** Three facts that are true today — no invented totals. */
export function Stats() {
  const stats = [
    { value: <CountUp to={3} />, label: "platforms tracked", note: "TikTok, Instagram, YouTube" },
    { value: <><CountUp to={100} />%</>, label: "hand-reviewed", note: "Every creator and brand, before they start" },
    { value: <>$<CountUp to={0} /></>, label: "to join", note: "Create an account for free" },
  ];
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-6 lg:px-8">
      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.label} variant="lift" delay={stagger(i)}>
            <div className="rounded-2xl border border-hairline bg-surface-2 px-6 py-7 text-center">
              <dd className="font-heading text-5xl font-semibold tabular-nums text-foreground">{s.value}</dd>
              <dt className="mt-2 text-sm font-semibold text-foreground">{s.label}</dt>
              <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
            </div>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
