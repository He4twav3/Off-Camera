import { Hero } from "@/components/marketing/hero";
import { Stats } from "@/components/marketing/stats";
import { BrandStrip } from "@/components/marketing/brand-strip";
import { WhoItsFor } from "@/components/marketing/who-its-for";
import { CurriculumShelf } from "@/components/marketing/curriculum-shelf";
import { Story } from "@/components/marketing/story";
import { Testimonials } from "@/components/marketing/testimonials";
import { ResultsStrip } from "@/components/marketing/results-strip";
import { MarketplaceShowcase } from "@/components/marketing/marketplace-showcase";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { FinalCTA } from "@/components/marketing/final-cta";
import { Reveal } from "@/components/marketing/reveal";

export default function Home() {
  return (
    <>
      <Reveal>
        <Hero />
      </Reveal>
      <Reveal>
        <Stats />
      </Reveal>
      <Reveal>
        <BrandStrip />
      </Reveal>
      <Reveal>
        <WhoItsFor />
      </Reveal>
      <Reveal>
        <CurriculumShelf />
      </Reveal>
      <Reveal>
        <Story />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <Reveal>
        <ResultsStrip />
      </Reveal>
      <Reveal>
        <MarketplaceShowcase />
      </Reveal>
      <Reveal>
        <Pricing />
      </Reveal>
      <Reveal>
        <FAQ />
      </Reveal>
      <Reveal>
        <FinalCTA />
      </Reveal>
    </>
  );
}
