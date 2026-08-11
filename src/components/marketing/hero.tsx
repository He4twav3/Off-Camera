import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
        <Badge
          variant="secondary"
          className="pill-outline rounded-full bg-toy-soft px-3 py-1 text-xs font-semibold text-toy-soft-foreground hover:bg-toy-soft"
        >
          A course by a working UGC creator
        </Badge>
        <h1 className="text-sticker mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Go viral without showing your face.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Hi, I&apos;m Aron. No followers. No camera. No expensive gear.
          Just the exact system I used to land my first paid brand deal in
          weeks, and keep landing them since. Watch the video below and
          I&apos;ll show you how.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="#pricing" />}
            className="btn-sticker"
          >
            Enroll now
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/course" />}
            className="btn-sticker bg-card"
          >
            See the curriculum
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          One-time payment · Lifetime access · Illustrative demo content
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <VideoPlayer
          aspect="video"
          label="Intro from Aron · 1:12"
          durationSeconds={72}
          poster={
            <VideoPoster>
              <p className="max-w-sm text-balance text-lg font-medium sm:text-xl">
                &ldquo;Here&apos;s exactly how I went from zero to
                full-time, without ever showing my face.&rdquo;
              </p>
            </VideoPoster>
          }
        />
      </div>
    </section>
  );
}
