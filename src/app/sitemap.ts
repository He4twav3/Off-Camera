import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { COURSE_PUBLIC } from "@/lib/feature-flags";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/brands`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteConfig.url}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    // Only while the course is public.
    ...(COURSE_PUBLIC
      ? [
          { url: `${siteConfig.url}/course`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
          { url: `${siteConfig.url}/refund-policy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 },
        ]
      : []),
  ];
}
