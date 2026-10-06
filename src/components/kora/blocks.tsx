import Link from "next/link";
import { ArrowRight, Plus, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { FadeIn } from "./fade-in";
import { CountUp } from "./count-up";
import { cn } from "@/lib/utils";

/** Big, tight headline with the second line in the accent colour, a line of
 * support, one button and a small note — the page opener. */
export function Hero({
  line1,
  line2,
  sub,
  cta,
  note,
  children,
}: {
  line1: string;
  line2: string;
  sub: string;
  cta: { href: string; label: string };
  note: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden px-5 pt-36 sm:pt-44">
      {/* a soft wash of the brand red at the top, like a lit backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(172,2,22,0.2),transparent)]"
      />
      <div className="relative mx-auto max-w-[1100px] text-center">
        <FadeIn>
          <h1 className="text-[clamp(2.7rem,8.4vw,5.9rem)] leading-[0.98] font-bold tracking-[-0.035em] text-balance">
            {line1}
            <br />
            <span className="ko-sheen">{line2}</span>
          </h1>
        </FadeIn>
        <FadeIn delay={120}>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#a39e98] text-pretty">{sub}</p>
          <Link
            href={cta.href}
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#ac0216] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#c4132a]"
          >
            {cta.label}
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-5 text-sm text-[#a39e98]">{note}</p>
        </FadeIn>
        {children && <FadeIn delay={240} className="mt-16">{children}</FadeIn>}
      </div>
    </section>
  );
}

/** A browser window around an example of the product. */
export function BrowserFrame({
  url,
  sidebar,
  tabs,
  children,
  badge = "Example data",
}: {
  url: string;
  badge?: string;
  /** Left-hand navigation. */
  sidebar?: { icon: LucideIcon; label: string; active?: boolean }[];
  /** Or a tab bar across the top instead of a sidebar. */
  tabs?: { icon: LucideIcon; label: string; active?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div
      aria-label="Example of the OnCamera dashboard"
      className="mx-auto max-w-[980px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#1d1c22] text-left shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-[#242329] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#3a3840]" />
        <span className="size-2.5 rounded-full bg-[#3a3840]" />
        <span className="size-2.5 rounded-full bg-[#3a3840]" />
        <span className="ml-2 min-w-0 truncate text-xs text-[#a39e98] sm:ml-3">{url}</span>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full border border-white/[0.09] px-2.5 py-0.5 text-[0.65rem] font-bold tracking-[0.12em] text-[#a39e98] uppercase">
          {badge}
        </span>
      </div>
      {tabs && (
        <nav className="flex gap-0.5 overflow-x-auto border-b border-white/[0.07] px-3 py-3 sm:gap-1 sm:px-4">
          {tabs.map(({ icon: Icon, label, active }) => (
            <span
              key={label}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm sm:gap-2 sm:px-4",
                active ? "bg-[#ac0216]/15 font-semibold text-[#e0556a]" : "text-[#a39e98]",
              )}
            >
              <Icon className="size-4" />
              {label}
            </span>
          ))}
        </nav>
      )}
      <div className={cn("grid grid-cols-1", sidebar && "sm:grid-cols-[190px_1fr]")}>
        {sidebar && (
        <aside className="hidden border-r border-white/[0.07] p-4 sm:block">
          <ul className="flex flex-col gap-1">
            {sidebar.map(({ icon: Icon, label, active }) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-[#ac0216]/15 font-semibold text-[#e0556a]" : "text-[#a39e98]",
                )}
              >
                <Icon className="size-4" />
                {label}
              </li>
            ))}
          </ul>
        </aside>
        )}
        <div className="min-w-0 p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function StatTile({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.08] px-2.5 py-2.5 sm:px-4 sm:py-3.5">
      <p className="text-[0.5rem] font-bold tracking-[0.06em] text-[#a39e98] uppercase sm:text-[0.65rem] sm:tracking-[0.14em]">{label}</p>
      <p className={cn("mt-1 text-lg font-bold tabular-nums sm:text-2xl", accent && "text-[#e0556a]")}>{value}</p>
    </div>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "accent" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone === "good" && "bg-emerald-400/10 text-emerald-300",
        tone === "accent" && "bg-[#ac0216]/15 text-[#e0556a]",
        tone === "neutral" && "bg-white/[0.06] text-[#a39e98]",
      )}
    >
      {children}
    </span>
  );
}

/** Section title, centred and plain. */
export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <FadeIn className="mx-auto max-w-2xl text-center">
      <h2 className="text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-[#a39e98]">{sub}</p>}
    </FadeIn>
  );
}

/** A feature card: icon tile, title, one line, then a small picture of it. */
export function FeatureCard({
  icon: Icon,
  title,
  body,
  className,
  delay,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <FadeIn delay={delay} className={className}>
      <div className="flex h-full min-w-0 flex-col rounded-3xl border border-white/[0.08] bg-[#1d1c22] p-6 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#ac0216]/15 text-[#e0556a]">
          <Icon className="size-5" />
        </span>
        <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em] sm:mt-6">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#a39e98]">{body}</p>
        <div className="mt-5 flex flex-1 flex-col justify-center rounded-2xl border border-white/[0.07] bg-[#16151a] p-4 sm:mt-6" aria-hidden>
          {children}
        </div>
      </div>
    </FadeIn>
  );
}

/** A band of big numbers between hairlines. */
export function StatsBand({ stats }: { stats: { value: ReactNode; label: string }[] }) {
  return (
    <section className="mt-24 border-y border-white/[0.07] bg-[#1a191e]">
      <dl className={cn("mx-auto grid max-w-[1000px] gap-3 px-4 py-10 text-center sm:gap-10 sm:px-6 sm:py-14", stats.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
        {stats.map((s) => (
          <FadeIn key={s.label}>
            <dd className="text-3xl font-bold tracking-[-0.03em] tabular-nums sm:text-5xl">{s.value}</dd>
            <dt className="mt-2 text-[0.7rem] leading-tight text-[#a39e98] sm:text-sm">{s.label}</dt>
          </FadeIn>
        ))}
      </dl>
    </section>
  );
}

/** The numbered flow: 01 / 02 / 03. */
export function Steps({ eyebrow, title, steps }: { eyebrow: string; title: string; steps: [string, string][] }) {
  return (
    <section className="mx-auto mt-24 max-w-[1100px] px-5">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-[0.75rem] font-bold tracking-[0.18em] text-[#e0556a] uppercase">{eyebrow}</p>
        <h2 className="mt-3 text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">{title}</h2>
      </FadeIn>
      <ol className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-3">
        {steps.map(([head, body], i) => (
          <FadeIn key={head} delay={i * 90}>
            <li className="h-full rounded-3xl border border-white/[0.08] bg-[#1d1c22] p-6 sm:p-7">
              <span className="font-mono text-sm font-bold text-[#e0556a]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em]">{head}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#a39e98]">{body}</p>
            </li>
          </FadeIn>
        ))}
      </ol>
    </section>
  );
}

/** Questions as separate rounded cards that open with a plus. */
export function Faq({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section id="faq" className="mx-auto mt-24 max-w-3xl scroll-mt-28 px-5">
      <SectionTitle title={title} />
      <div className="mt-12 flex flex-col gap-3">
        {items.map(([q, a], i) => (
          <FadeIn key={q} delay={Math.min(i, 3) * 60}>
            <details className="group rounded-2xl border border-white/[0.08] bg-[#1d1c22] px-6 transition-colors open:bg-[#201f25]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <Plus className="size-5 shrink-0 text-[#a39e98] transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="pb-6 text-[15px] leading-relaxed text-[#a39e98]">{a}</p>
            </details>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

export { CountUp };

/** A creator's username with a gray "@" in front. */
export function AtHandle({ handle }: { handle: string }) {
  return (
    <>
      <span className="text-[#a39e98]">@</span>
      {handle}
    </>
  );
}
