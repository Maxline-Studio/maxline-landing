import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Differentiators } from "@/components/sections/differentiators";
import { Promises } from "@/components/sections/promises";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { Faq } from "@/components/sections/faq";
import { Subscribe } from "@/components/sections/subscribe";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <HowItWorks />
        <Differentiators />
        <Promises />
        <PricingPreview />
        <Faq />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
