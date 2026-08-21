import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { VideoPoster } from "@/components/media/video-poster";
import { getDashboardProgress } from "@/lib/progress";
import { toggleLesson } from "@/app/dashboard/actions";

export async function ContinueLearning() {
  const { nextLesson, percent, isComplete } = await getDashboardProgress();

  if (isComplete || !nextLesson) {
    return (
      <Card className="border-border/70">
        <CardContent className="flex items-center gap-4 py-8 text-center sm:flex-col">
          <PartyPopper className="mx-auto size-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">You&apos;ve finished the course</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All 8 modules complete. Revisit any lesson below whenever you
              need a refresher.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isFirstLesson = percent === 0;

  return (
    <Card className="overflow-hidden border-border/70 py-0">
      <CardContent className="grid grid-cols-1 gap-0 p-0 sm:grid-cols-[10rem_1fr]">
        <VideoThumbnail
          aspect="video"
          poster={
            <VideoPoster>
              <span className="font-heading text-2xl font-semibold">
                {nextLesson.moduleIndex + 1}
              </span>
            </VideoPoster>
          }
          duration={nextLesson.duration}
          dialogTitle={`Module ${nextLesson.moduleIndex + 1} · ${nextLesson.name}`}
          youtubeId={nextLesson.youtubeId}
          className="h-40 w-full rounded-none border-0 sm:h-full"
        />
        <div className="p-6">
          <p className="text-xs font-medium text-muted-foreground">
            {isFirstLesson ? "Start here" : "Continue where you left off"}
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            Module {nextLesson.moduleIndex + 1} · {nextLesson.name}
          </h3>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={percent} className="h-2" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {percent}% of course complete
            </span>
          </div>
          <form action={toggleLesson}>
            <input type="hidden" name="lessonId" value={nextLesson.id} />
            <Button type="submit" className="mt-5">
              Mark lesson complete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
