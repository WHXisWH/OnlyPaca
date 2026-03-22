import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedSlider } from "@/components/FeaturedSlider";
import { CreatorScroll } from "@/components/CreatorScroll";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <FeaturedSlider />
      <CreatorScroll />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}
