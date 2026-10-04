import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";
import { stagger } from "@/components/marketing/motion";

const tracks = [
  {
    id: "creators",
    label: "For creators",
    title: "Find campaigns. Keep every deal on track.",
    points: [
      "Browse open campaigns from real brands",
      "A verified profile brands can trust",
      "Your views and earnings in one dashboard",
      "A free course to sharpen your content",
    ],
    cta: { href: "/create-account", text: "Join as a creator", primary: true },
  },
  {
    id: "brands",
    label: "For brands",
    title: "Run campaigns with creators we have vetted.",
    points: [
      "Hand-reviewed creators, matched to your campaign",
      "We set the campaign up with you",
      "Every post and its views, updated daily",
      "One dashboard for the whole campaign",
    ],
    cta: { href: "/create-account?type=brand", text: "Create a brand account", primary: false },
  },
] as const;

export function ForWho() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((t, i) => (
          <Reveal key={t.id} variant="lift" delay={stagger(i)}>
            <div id={t.id} className="flex h-full scroll-mt-28 flex-col rounded-2xl border border-hairline bg-surface-2 p-7 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.14em] text-crimson-bright uppercase">{t.label}</p>
              <h3 className="font-heading mt-3 text-2xl font-semibold text-balance text-foreground">{t.title}</h3>
              <ul className="mt-6 flex flex-col gap-3">
                {t.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-toy-soft-foreground" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex-1" />
              <Button
                size="lg"
                variant={t.cta.primary ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={t.cta.href} />}
                className={
                  t.cta.primary
                    ? "btn-cta-glass h-11 w-full rounded-full font-bold text-cta-foreground sm:w-fit sm:px-7"
                    : "h-11 w-full rounded-full font-bold sm:w-fit sm:px-7"
                }
              >
                {t.cta.text}
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
