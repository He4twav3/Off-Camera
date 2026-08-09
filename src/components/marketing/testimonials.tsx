import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VideoThumbnail } from "@/components/media/video-thumbnail";
import { VideoPoster } from "@/components/media/video-poster";

const testimonials = [
  {
    initials: "JM",
    name: "Jamie M.",
    role: "Landed first brand deal in week 3",
    quote:
      "I didn't think faceless content could actually make money. Two months in, I had three brands reaching out to me instead of the other way around.",
    duration: "0:42",
  },
  {
    initials: "PK",
    name: "Priya K.",
    role: "Now doing UGC full-time",
    quote:
      "The pitching templates alone paid for the course ten times over. I finally understood what brands were actually looking for.",
    duration: "0:38",
  },
  {
    initials: "DT",
    name: "Diego T.",
    role: "Ex 9-to-5, now full-time creator",
    quote:
      "Straightforward, no fluff, no 'believe in yourself' filler. Just the actual steps, in order, that I could follow the same day.",
    duration: "0:51",
  },
];

export function Testimonials() {
  return (
    <section id="reviews" className="border-y border-border/70 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
            Students who made the leap
          </h2>
          <p className="mt-4 text-muted-foreground">
            AI-generated example videos, illustrating the kind of results
            students describe.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="card-sticker gap-4 rounded-2xl bg-card">
              <CardContent className="flex h-full flex-col">
                <VideoThumbnail
                  aspect="portrait"
                  poster={
                    <VideoPoster variant="muted">
                      <span className="font-heading text-2xl font-semibold">
                        {t.initials}
                      </span>
                    </VideoPoster>
                  }
                  label={t.name}
                  duration={t.duration}
                  badge="AI-generated"
                  dialogTitle={`AI-generated example video, styled as a testimonial from ${t.name}`}
                  className="mb-1 border-2 border-ink"
                />

                <div className="mt-3 flex gap-0.5 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
