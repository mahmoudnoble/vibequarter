// Revalidate the landing page at most every hour — plans data is cached separately.
// Eliminates the cold Supabase round-trip on every visit.
export const revalidate = 3600;

import { Aurora } from "@/components/motion/aurora";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { MarqueeStrip } from "@/components/landing/marquee-strip";
import { Specializations } from "@/components/landing/specializations";
import { Work } from "@/components/landing/work";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { BeforeAfter } from "@/components/landing/before-after";
import { Pricing } from "@/components/landing/pricing";
import { Why } from "@/components/landing/why";
import { Blog } from "@/components/landing/blog";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";
import { getActivePlans } from "@/lib/plans";

export default async function HomePage() {
  const plans = await getActivePlans();
  return (
    <>
      <Nav />
      <main className="relative">
        <Hero />
        <MarqueeStrip />
        {/* Shared dark zone — Specializations + Work read as one continuous background */}
        <div className="tone-dark relative isolate overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-grid absolute inset-0 mask-fade-y opacity-50" />
            <Aurora intensity="soft" />
          </div>
          <Specializations />
          <Work />
        </div>
        <HowItWorks />
        <Features />
        <BeforeAfter />
        <Pricing plans={plans} />
        <Why />
        <Blog />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
