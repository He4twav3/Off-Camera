import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";
import { MascotWave } from "@/components/illustrations/mascots";
import { siteConfig } from "@/lib/site-config";

const credentials = [
  "80+ paid brand campaigns",
  "Worked with DTC & app-based brands",
  "Zero face-on-camera content, ever",
];

export function Story() {
  return (
    <section id="story" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="card-sticker relative grid gap-10 rounded-3xl bg-card p-6 sm:p-10 md:grid-cols-[20rem_1fr] md:items-center md:p-12">
        <MascotWave
          variant="soft"
          className="absolute -top-6 -right-4 hidden w-16 rotate-6 drop-shadow-md sm:block md:w-20"
        />
        <VideoPlayer
          aspect="portrait"
          label="My story · 2:04"
          durationSeconds={124}
          youtubeId={siteConfig.videos.story}
          className="mx-auto w-full max-w-xs"
          poster={
            <VideoPoster variant="muted">
              <span className="font-heading text-3xl font-semibold">AR</span>
            </VideoPoster>
          }
        />

        <div>
          <Badge
            variant="secondary"
            className="pill-outline rounded-full bg-toy-strong px-3 py-1 text-xs font-semibold text-toy-strong-foreground hover:bg-toy-strong"
          >
            Why I built this course
          </Badge>
          <h2 className="text-sticker-sm mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            I&apos;m Aron. This is the exact playbook I used, not a theory
            class.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A few years ago I was filming content nobody watched. Then I
            switched to faceless formats and everything changed. Brands
            started reaching out to me instead of the other way around. I
            built a full-time business around content I never had to appear
            in on camera, and this course is me walking you through every
            step, the way I wish someone had walked me through it.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {credentials.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
