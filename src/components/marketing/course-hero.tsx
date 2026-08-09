import { BookOpen, Clock, Infinity as InfinityIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const meta = [
  { icon: BookOpen, label: "8 modules · 25 lessons" },
  { icon: Clock, label: "~4.5 hours" },
  { icon: InfinityIcon, label: "Lifetime access" },
];

export function CourseHero() {
  return (
    <section className="border-b border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
          The full course
        </Badge>
        <h1 className="text-sticker mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Off Camera: Faceless Content & Brand Deals
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Everything you need to create faceless content that performs, pitch
          it to brands, and keep getting picked for campaigns. No camera
          confidence required.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {meta.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="size-4 text-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
