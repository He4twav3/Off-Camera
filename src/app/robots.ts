import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard is the logged-in student area — nothing there is
      // meant to rank, and indexing it would leak mock account UI into
      // search results.
      disallow: "/dashboard",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
