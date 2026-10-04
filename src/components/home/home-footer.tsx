import Link from "next/link";
import { Logo } from "@/components/site/logo";

const columns = [
  {
    title: "Creators",
    links: [
      { href: "/create-account", label: "Join as a creator" },
      { href: "/login", label: "Log in" },
      { href: "/course", label: "The course" },
    ],
  },
  {
    title: "Brands",
    links: [
      { href: "/create-account?type=brand", label: "Create a brand account" },
      { href: "/login", label: "Brand log in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1100px] gap-10 px-5 py-14 sm:grid-cols-[1.4fr_repeat(3,1fr)] sm:px-6 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The UGC agency for brands and creators.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{c.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-foreground/85 transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-[1100px] px-5 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} OnCamera
        </p>
      </div>
    </footer>
  );
}
