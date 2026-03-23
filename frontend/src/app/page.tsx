import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { ComparisonTable } from "@/components/ComparisonTable";
import { HowItWorks } from "@/components/HowItWorks";
import { Thesis } from "@/components/Thesis";
import { CTASection } from "@/components/CTASection";
import { CreatorScroll } from "@/components/CreatorScroll";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <Header />

      {/* Hero - Main headline and CTA */}
      <Hero />

      {/* Problem Section - Why Web2 and naked on-chain both fail */}
      <ProblemSection />

      {/* Comparison Table - Web2 vs Naked vs FHE */}
      <ComparisonTable />

      {/* How It Works - Three layers of protection with code mocks */}
      <HowItWorks />

      {/* Thesis - Final statement */}
      <Thesis />

      {/* CTA - Conversion prompt */}
      <CTASection />

      {/* Creator showcase - Social proof */}
      <CreatorScroll />

      {/* Footer */}
      <Footer />
    </main>
  );
}
