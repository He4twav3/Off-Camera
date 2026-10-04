import Link from "next/link";
import { Logo } from "@/components/site/logo";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/create-account", label: "Sign up" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "For brands",
    links: [
      { href: "/brands", label: "Why OnCamera" },
      { href: "/create-account?type=brand", label: "Start a campaign" },
      { href: "/login", label: "Brand log in" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-[#0f0e12] text-[#a39e98]">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-6 py-16 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            OnCamera is the UGC agency for brands and creators: campaigns, verified accounts and
            tracked results.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-[0.7rem] font-bold tracking-[0.18em] uppercase">{c.title}</p>
            <ul className="mt-5 flex flex-col gap-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-[#edeae4]/85 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-[0.7rem] font-bold tracking-[0.18em] uppercase">
          <span>© {new Date().getFullYear()} OnCamera</span>
          <span className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
