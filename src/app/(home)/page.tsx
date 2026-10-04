import type { Metadata } from "next";
import { HomeHero } from "@/components/home/home-hero";
import { BrandRow } from "@/components/home/brand-row";
import { Bento } from "@/components/home/bento";
import { Stats } from "@/components/home/stats";
import { ForWho } from "@/components/home/for-who";
import { HomeFAQ } from "@/components/home/home-faq";
import { HomeCTA } from "@/components/home/home-cta";

export const metadata: Metadata = {
  title: { absolute: "OnCamera · The UGC agency for brands and creators" },
  description:
    "OnCamera matches brands with vetted UGC creators and tracks every post's views. Join as a brand or as a creator.",
  alternates: { canonical: "/" },
};

/**
 * The agency homepage — a clean, two-audience page in its own layout
 * ((home)/layout.tsx), separate from the course page's cinematic look. Only
 * real claims: no invented client counts, creator totals or testimonials, and
 * the figures inside the workspace cards are labelled "Example".
 */
export default function Home() {
  return (
    <>
      <HomeHero />
      <BrandRow />
      <Bento />
      <Stats />
      <ForWho />
      <HomeFAQ />
      <HomeCTA />
    </>
  );
}
