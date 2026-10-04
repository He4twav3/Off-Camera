import type { Metadata } from "next";
import { Brands } from "@/components/marketing/brand-constellation";
import { SectionSeam } from "@/components/marketing/section-frame";
import { ViewfinderFrame } from "@/components/site/viewfinder-frame";
import { HomeHero } from "@/components/home/home-hero";
import { Bento } from "@/components/home/bento";
import { Audiences } from "@/components/home/audiences";
import { HomeFAQ } from "@/components/home/home-faq";
import { HomeCTA } from "@/components/home/home-cta";

export const metadata: Metadata = {
  title: { absolute: "OnCamera · The UGC agency for brands and creators" },
  description:
    "OnCamera matches brands with vetted UGC creators and tracks every post's views. Join as a brand or as a creator.",
  alternates: { canonical: "/" },
};

/**
 * The agency homepage. Two audiences, one page: brands and creators each get
 * their own track. The course that used to live here is at /course now and is
 * presented as a creator perk. Only real claims go on this page — no invented
 * client counts, creator totals or testimonials; the example figures inside the
 * feature cards are labelled "Example".
 */
export default function Home() {
  return (
    <>
      <ViewfinderFrame />
      <HomeHero />
      <SectionSeam />
      <Brands />
      <SectionSeam />
      <Audiences />
      <SectionSeam />
      <Bento />
      <SectionSeam />
      <HomeFAQ />
      <SectionSeam />
      <HomeCTA />
    </>
  );
}
