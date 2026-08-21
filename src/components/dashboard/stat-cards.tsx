import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardProgress, formatMinutes } from "@/lib/progress";

export async function StatCards() {
  const { completedLessons, totalLessons, completedModules, totalModules, minutesInvested } =
    await getDashboardProgress();

  const stats = [
    {
      icon: CheckCircle2,
      value: `${completedLessons} / ${totalLessons}`,
      label: "Lessons completed",
    },
    {
      icon: BookOpen,
      value: `${completedModules} / ${totalModules}`,
      label: "Modules completed",
    },
    { icon: Clock, value: formatMinutes(minutesInvested), label: "Time invested" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/70">
          <CardContent className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold leading-tight">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
