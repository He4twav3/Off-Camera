import Link from "next/link";
import { DiscordLink } from "@/components/site/discord-link";
import { FooterWordmark } from "@/components/site/footer-wordmark";
import { Logo } from "@/components/site/logo";
import { siteConfig } from "@/lib/site-config";

/**
 * The footer, built to the reference site's measured layout.
 *
 * Every number here was read off their live footer in a browser rather
 * than estimated, then re-coloured to our palette — their warm cream and
 * orange is not ours, but the structure is theirs exactly:
 *
 *   container      1240px, centred (100px side margins at 1440)
 *   row gap        20px between the two rows
 *   ROW 1 "top"    logo hard left · "Social media" label + icon buttons
 *                  hard right. Icons 32x32, 4px radius, 8px apart, with
 *                  the label sitting to their LEFT at 19px gap.
 *   ROW 2 "links"  tagline hard left at 239px wide · a 480px menu block
 *                  hard right, three 133px columns, 40px between them,
 *                  12px between a column heading and its first item,
 *                  10px between items.
 *   type           column headings 14px/500, links and tagline 12px/400.
 *                  Small — a footer is scanned, not read.
 *
 * What their footer does NOT have, and so neither does this one: a
 * newsletter band or a second heading. Those were mine, in an earlier
 * pass, and they were the reason the bottom of the page had three
 * competing tiers where the reference has two calm rows plus one quiet
 * background layer.
 *
 * THAT THIRD LAYER — the oversized cropped wordmark — turned out to be
 * real on closer inspection, not invented the first time around: their
 * footer sits a huge, low-contrast "Parley" behind the legal line,
 * cropped by the bottom edge of its own band. FooterWordmark below is
 * that layer, adapted to our name and palette rather than an image import
 * of theirs — see that file for the measurements. It renders after ROW 2
 * and before the legal line, in the same document position theirs holds,
 * and it does not touch either row's own spacing to get there.
 *
 * The colour mapping, since it is the only thing deliberately not copied:
 *   their ink   #251f19  →  text-foreground
 *   their muted #68615a  →  text-muted-foreground
 *   their orange #f48d16 →  the brand crimson — on the tally dot inside
 *                           the logo, and on the mosaic scattered across
 *                           FooterWordmark below, which is exactly where
 *                           their own orange appears too.
 */
const columns = [
  {
    title: "Course",
    links: [
      { href: "/#proof", label: "Proof" },
      { href: "/#curriculum", label: "Curriculum" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
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
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/refund-policy", label: "Refunds" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-surface-0/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-14 sm:px-6 lg:px-8">
        {/* ── ROW 1 · top ─────────────────────────────────────────── */}
        {/* Used to also carry a "Social media" label + row of Instagram/
            TikTok/YouTube icon buttons on the right. Removed — every one
            of them pointed at siteConfig.social's placeholder "#" href
            (see that file), not a real account, so the row was three
            dead buttons dressed as a real presence. A wrong or fake link
            is worse than no link at all, same standard the brand marks
            elsewhere on the site already hold real logos to. */}
        <div className="flex flex-wrap items-center gap-6">
          <Logo />
        </div>

        {/* ── ROW 2 · links ───────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-10 pt-6 md:flex-row md:gap-16">
          <p className="max-w-[239px] text-xs leading-relaxed text-muted-foreground">
            Real breakdowns of videos that reached millions of views, and the
            repeatable system behind them.
          </p>

          <div className="flex gap-10 sm:gap-[40px]">
            {columns.map((col) => (
              <div key={col.title} className="flex w-[133px] flex-col gap-3">
                <h3 className="text-sm font-medium text-foreground">
                  {col.title}
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="focus-premium rounded text-xs text-muted-foreground transition-colors duration-300 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── background layer · oversized wordmark ──────────────────
            Same document position as the reference's own: after the
            content rows, before the legal line. See footer-wordmark.tsx
            for the measurements. */}
        <FooterWordmark />

        {/* Legally necessary, kept as quiet as their own small print. */}
        <p className="mt-6 border-t border-hairline pt-6 text-xs text-muted-foreground/70">
          © 2026 {siteConfig.name}
          {siteConfig.communityUrl && (
            <>
              {" · "}
              <DiscordLink>Discord</DiscordLink>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
