import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Differentiators } from "@/components/sections/differentiators";
import { Comparison } from "@/components/sections/comparison";
import { CreatorVoices } from "@/components/sections/creator-voices";
import { Promises } from "@/components/sections/promises";
import { Atelier } from "@/components/sections/atelier";
import { PricingPreview } from "@/components/sections/pricing-preview";
import { Faq } from "@/components/sections/faq";
import { Subscribe } from "@/components/sections/subscribe";
import { JsonLd } from "@/components/json-ld";
import { softwareApplicationLd, faqPageLd } from "@/lib/seo";
import { faqs } from "@/lib/faq-data";

export default function HomePage() {
  return (
    <>
      <JsonLd data={[softwareApplicationLd, faqPageLd(faqs)]} />
      <Header />
      <main id="main-content">
        <Hero />
        <Manifesto />
        <HowItWorks />
        <Differentiators />
        <Comparison />
        <PricingPreview />
        <Promises />
        <Atelier />
        <CreatorVoices />
        <Faq />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
