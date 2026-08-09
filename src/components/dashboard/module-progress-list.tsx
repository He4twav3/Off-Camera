import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardProgress } from "@/lib/progress";
import { toggleLesson } from "@/app/dashboard/actions";

function statusIcon(done: number, total: number) {
  if (done === total) return <CheckCircle2 className="size-4 text-primary" />;
  if (done > 0) return <CircleDot className="size-4 text-primary" />;
  return <Circle className="size-4 text-muted-foreground" />;
}

export async function ModuleProgressList() {
  const { modules } = await getDashboardProgress();

  return (
    <Card className="border-border/70">
      <CardContent>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Your progress</h2>
          <p className="text-xs text-muted-foreground">
            Click a lesson to mark it complete
          </p>
        </div>
        <Accordion multiple className="mt-2">
          {modules.map((mod, i) => (
            <AccordionItem key={mod.id} value={mod.id}>
              <AccordionTrigger className="text-left text-sm font-medium">
                <span className="flex flex-1 items-center gap-4">
                  {statusIcon(mod.done, mod.total)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">
                      {i + 1}. {mod.title.replace(/^Module \d+:\s*/, "")}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2.5">
                      <Progress
                        value={(mod.done / mod.total) * 100}
                        className="h-1.5 w-32"
                      />
                      <span className="shrink-0 text-xs font-normal text-muted-foreground">
                        {mod.done}/{mod.total}
                      </span>
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="ml-8 space-y-1">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <form action={toggleLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary/60"
                        >
                          {lesson.done ? (
                            <CheckCircle2 className="size-4 shrink-0 text-primary" />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={
                              lesson.done
                                ? "flex-1 text-muted-foreground line-through decoration-muted-foreground/50"
                                : "flex-1"
                            }
                          >
                            {lesson.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lesson.duration}
                          </span>
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
