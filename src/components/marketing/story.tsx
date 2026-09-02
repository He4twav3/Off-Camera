import { VideoPlayer } from "@/components/media/video-player";
import { VideoPoster } from "@/components/media/video-poster";
import { ApertureMark } from "@/components/illustrations/aperture-mark";
import { siteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/marketing/reveal";
import { BEAT } from "@/components/marketing/motion";
import { SectionEyebrow } from "@/components/marketing/section-frame";
import { cn } from "@/lib/utils";

// Only claims we can actually stand behind go here. No campaign/student
// counts until they're confirmed real (see proof-content.ts's own note on
// this) — the 6M+/15M+ figures are the two numbers that are.
const credentials = [
  "Videos that reached 6M+ and 15M+ views",
  "Built from testing, not theory",
  "Works on camera, not showing your face, or silent",
];

/**
 * Who is teaching this.
 *
 * The layout is conditional on whether a real founder video exists, and
 * that is the point rather than an implementation detail.
 *
 * This section used to be a fixed two-column card with a portrait video
 * frame on the left — except `siteConfig.videos.story` is deliberately
 * empty (no footage has been recorded, and the site's standing rule is
 * placeholders over stand-in footage from other creators). So what
 * actually rendered was a 300×540 empty grey rectangle with the initials
 * "AR" in it, holding down the most valuable half of the block and
 * telling the reader nothing. A layout that reserves space for content
 * that does not exist doesn't read as "a video is coming", it reads as
 * something failing to load.
 *
 * So the video column only exists when there is a video to put in it.
 * Without one, this is a single editorial column at a comfortable
 * measure — which is what the section is anyway: one person explaining
 * why they built this. Drop a real (even unlisted) YouTube id into
 * siteConfig.videos.story and the two-column layout comes back on its
 * own, with no further change here.
 */
export function Story() {
  const storyVideo = siteConfig.videos.story;

  return (
    <section
      id="story"
      className="relative mx-auto max-w-[1240px] scroll-mt-20 px-5 py-20 sm:px-6 lg:scroll-mt-32 lg:px-8"
    >
      <div
        className={cn(
          "card-premium relative gap-10 overflow-hidden rounded-[20px] bg-surface-1 p-6 sm:p-10 md:p-12",
          storyVideo
            ? "grid md:grid-cols-[19rem_1fr] md:items-center"
            : // No video: a single column at a readable measure rather
              // than one paragraph stretched across the full card width,
              // which is its own kind of empty.
              "mx-auto max-w-3xl"
        )}
      >
        {/* Key light falling across the block from the upper right, where
            the aperture mark sits — the card lit from a source, rather
            than filled with a flat tone. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-[radial-gradient(circle,oklch(1_0_0_/_0.06)_0%,transparent_68%)] blur-3xl"
        />

        {/* Replaces the cartoon mascot that used to break this corner. It
            does the same compositional job — stopping the card reading as
            a plain rectangle — in the same stroke-only camera language as
            the viewfinder marks, so it's serious instead of jolly. */}
        <Reveal delay={BEAT.body} className="absolute -top-5 -right-4 hidden sm:block">
          <ApertureMark className="w-16 text-foreground/25 md:w-20" />
        </Reveal>

        {storyVideo && (
          <Reveal variant="fade">
            <VideoPlayer
              aspect="portrait"
              frame="premium"
              label="My story"
              youtubeId={storyVideo}
              className="mx-auto w-full max-w-xs"
              poster={
                <VideoPoster>
                  <span className="font-mono text-3xl font-semibold tracking-[0.1em]">AR</span>
                </VideoPoster>
              }
            />
          </Reveal>
        )}

        <div className="relative">
          <Reveal delay={BEAT.eyebrow}>
            <SectionEyebrow index="05" label="Why we built this" align="start" />
          </Reveal>
          <Reveal delay={BEAT.title}>
            <h2 className="text-lit mt-5 text-2xl leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-[2rem]">
              I&apos;m Aron. This is the system, not a theory class.
            </h2>
          </Reveal>
          <Reveal delay={BEAT.lede}>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              The creators getting huge reach weren&apos;t the ones with the
              biggest audiences or the best cameras. They understood hooks,
              retention, format, volume, consistency, and iteration. We
              tested those principles ourselves, on our own content, and some
              of it reached millions of views. This course breaks down that
              process so you can learn it instead of spending months
              guessing.
            </p>
          </Reveal>
          <Reveal delay={BEAT.body}>
            <span className="rule-fade mt-8 block" aria-hidden />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {credentials.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                >
                  {/* A short crimson tick rather than a bullet dot — the
                      accent marking verified claims, which is one of the
                      few jobs it has on this page. */}
                  <span
                    aria-hidden
                    className="mt-1.5 h-px w-3 shrink-0 bg-crimson-bright"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
