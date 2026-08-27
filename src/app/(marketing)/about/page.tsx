import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.creator.name}, the creator behind ${siteConfig.name}.`,
  alternates: { canonical: "/about" },
};

// Only claims we can actually stand behind — see proof-content.ts's note
// on why past campaign/student counts were removed rather than kept as
// unverified placeholders.
const credentials = [
  "Videos that reached 6M+ and 15M+ views",
  "Built from testing, not theory",
  "Works on camera, not showing your face, or silent",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
        About {siteConfig.creator.name}
      </h1>
      <p className="mt-2 text-muted-foreground">{siteConfig.creator.role}</p>

      <div className="card-premium mt-8 rounded-2xl bg-card p-6 sm:p-8">
        <p className="text-base leading-relaxed">
          I&apos;m Aron. I noticed the creators getting huge reach weren&apos;t
          necessarily the ones with the biggest audiences or the best
          cameras, they understood hooks, retention, format, volume,
          consistency, and iteration. So I tested those principles myself,
          on my own content, and some of it reached millions of views.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          {siteConfig.name} breaks down that process so you can learn it
          instead of spending months guessing, the actual videos, the actual
          breakdowns, and the system behind them.
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {credentials.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/#curriculum" />} className="btn-premium">
          See the course
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`mailto:${siteConfig.contactEmail}`} />}
          className="btn-premium bg-card"
        >
          Get in touch
        </Button>
      </div>
    </div>
  );
}
