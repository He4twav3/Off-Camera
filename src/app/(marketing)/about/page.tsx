import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.creator.name}, the creator behind ${siteConfig.name}.`,
  alternates: { canonical: "/about" },
};

const credentials = [
  "80+ paid brand campaigns",
  "Worked with DTC & app-based brands",
  "Zero face-on-camera content, ever",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-sticker text-3xl font-semibold tracking-tight sm:text-4xl">
        About {siteConfig.creator.name}
      </h1>
      <p className="mt-2 text-muted-foreground">{siteConfig.creator.role}</p>

      <div className="card-sticker mt-8 rounded-2xl bg-card p-6 sm:p-8">
        <p className="text-base leading-relaxed">
          I&apos;m Aron, a full-time content creator who never shows my face
          on camera. A few years ago I was filming content nobody watched.
          Then I switched to faceless formats and everything changed: brands
          started reaching out to me instead of the other way around.
        </p>
        <p className="mt-4 text-base leading-relaxed">
          I&apos;ve since completed 80+ paid brand campaigns without ever
          being on camera, and {siteConfig.name} is me walking you through
          the exact steps, the way I wish someone had walked me through it.
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
        <Button nativeButton={false} render={<Link href="/course" />} className="btn-sticker">
          See the course
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`mailto:${siteConfig.contactEmail}`} />}
          className="btn-sticker bg-card"
        >
          Get in touch
        </Button>
      </div>
    </div>
  );
}
