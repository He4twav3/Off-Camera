import { siteConfig } from "@/lib/site-config";

/**
 * schema.org/Course structured data for the course page, so Google (and
 * marketplace crawlers that respect schema.org) can understand what's being
 * sold and at what price.
 *
 * Deliberately NOT included: aggregateRating / Review markup. The
 * testimonials on this page are illustrative placeholders, not real
 * reviews — shipping fake review structured data is a Google Search
 * spam violation (and just dishonest). Add Review/AggregateRating markup
 * only once there are real, collected reviews to report.
 */
export function CourseJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Off Camera: Faceless Content & Brand Deals",
    description:
      "A hands-on course on creating faceless viral content, UGC for brands, and getting picked for campaigns.",
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    offers: {
      "@type": "Offer",
      price: siteConfig.price.amount,
      priceCurrency: siteConfig.price.currency,
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/checkout`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
