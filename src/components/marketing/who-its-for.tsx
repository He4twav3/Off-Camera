import { Sparkles, TrendingUp, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const personas = [
  {
    icon: Sparkles,
    variant: "soft" as const,
    title: "You've never posted before",
    description:
      "Zero followers, zero videos, no niche picked yet. This course starts from nothing, on purpose.",
  },
  {
    icon: TrendingUp,
    variant: "base" as const,
    title: "You're already posting, but not getting paid",
    description:
      "You've got content and maybe even an audience, you just don't know how to turn it into brand deals.",
  },
  {
    icon: Briefcase,
    variant: "strong" as const,
    title: "You want a real way out of the 9-to-5",
    description:
      "Looking for an actual income replacement plan, not a hobby you post about once a month.",
  },
];

const ICON_BG = {
  soft: "bg-toy-soft text-toy-soft-foreground",
  base: "bg-toy-base text-toy-base-foreground",
  strong: "bg-toy-strong text-toy-strong-foreground",
};

export function WhoItsFor() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
          Is this for you?
        </h2>
        <p className="mt-4 text-muted-foreground">
          If any of these sound like you, the course is built for exactly
          where you&apos;re starting from.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {personas.map((p) => (
          <Card key={p.title} className="card-sticker rounded-2xl bg-card">
            <CardContent>
              <span
                className={`pill-outline flex size-11 items-center justify-center rounded-full ${ICON_BG[p.variant]}`}
              >
                <p.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {p.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
