import { CURRICULUM } from "@/lib/curriculum";

export type SearchEntry = {
  title: string;
  description?: string;
  href: string;
  group: "Pages" | "Curriculum" | "Legal";
};

const pages: SearchEntry[] = [
  { title: "Home", href: "/", group: "Pages" },
  { title: "The Course", description: "Full curriculum and pricing", href: "/course", group: "Pages" },
  { title: "Start here", description: "Short, single-page overview", href: "/go", group: "Pages" },
  { title: "Pricing", href: "/course#pricing", group: "Pages" },
  { title: "Curriculum", href: "/course#curriculum", group: "Pages" },
  { title: "Story", description: "Why the course was built", href: "/#story", group: "Pages" },
  { title: "Reviews", href: "/course#reviews", group: "Pages" },
  { title: "FAQ", href: "/course#faq", group: "Pages" },
  { title: "About", description: "About the creator", href: "/about", group: "Pages" },
  { title: "Changelog", description: "What's new on the site", href: "/changelog", group: "Pages" },
  { title: "Dashboard", description: "Sign in required", href: "/dashboard", group: "Pages" },
  { title: "Log in", href: "/login", group: "Pages" },
];

const legal: SearchEntry[] = [
  { title: "Terms of Service", href: "/terms", group: "Legal" },
  { title: "Privacy Policy", href: "/privacy", group: "Legal" },
  { title: "Refund Policy", href: "/refund-policy", group: "Legal" },
];

const curriculum: SearchEntry[] = CURRICULUM.flatMap((mod) => [
  { title: mod.title, description: `${mod.lessons.length} lessons`, href: `/course?q=${encodeURIComponent(mod.title)}#curriculum`, group: "Curriculum" as const },
  ...mod.lessons.map((lesson) => ({
    title: lesson.name,
    description: `${mod.title} · ${lesson.duration}`,
    href: `/course?q=${encodeURIComponent(lesson.name)}#curriculum`,
    group: "Curriculum" as const,
  })),
]);

/**
 * Real, static search index built from the site's actual pages, sections,
 * and every module/lesson in curriculum.ts — not a placeholder that only
 * queries the curriculum accordion. See SiteSearch for how it's queried.
 */
export const SEARCH_INDEX: SearchEntry[] = [...pages, ...curriculum, ...legal];
