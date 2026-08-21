import Link from "next/link";
import { Camera, PlayCircle, Music2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { siteConfig } from "@/lib/site-config";

const columns = [
  {
    title: "Course",
    links: [
      { href: "/course", label: "Curriculum" },
      { href: "/course#pricing", label: "Pricing" },
      { href: "/course#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/changelog", label: "Changelog" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t-[3px] border-ink bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              A no-fluff course on creating faceless viral content, landing brand deals,
              and getting picked for campaigns, built from real experience, not theory.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <Link
                href={siteConfig.social.instagram}
                aria-label="Instagram"
                className="pill-outline flex size-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Camera className="size-4" />
              </Link>
              <Link
                href={siteConfig.social.tiktok}
                aria-label="TikTok"
                className="pill-outline flex size-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Music2 className="size-4" />
              </Link>
              <Link
                href={siteConfig.social.youtube}
                aria-label="YouTube"
                className="pill-outline flex size-8 items-center justify-center rounded-full bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <PlayCircle className="size-4" />
              </Link>
            </div>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
          <p>Content and results shown are illustrative for this demo build.</p>
        </div>
      </div>
    </footer>
  );
}
