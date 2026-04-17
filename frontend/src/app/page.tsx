import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { CTASection } from "@/components/CTASection";
import { CreatorScroll } from "@/components/CreatorScroll";
import { Footer } from "@/components/Footer";

const journeyCards = [
  {
    title: "Fan path",
    description:
      "Explore a live creator profile, authorize privately, then run access verification before opening content.",
    points: ["No direct subscription call from your wallet", "Explicit unlock step built around CoFHE"],
  },
  {
    title: "Creator path",
    description:
      "Register on-chain, price your membership, attach a content URL, reveal revenue privately, and withdraw deliberately.",
    points: ["Encrypted revenue accumulation", "Creator-only revenue visibility"],
  },
  {
    title: "Privacy path",
    description:
      "The UI now states the privacy constraints directly instead of faking a global subscription list that the protocol should not expose.",
    points: ["Browser-private memory layer", "Fresh FHE verification remains the source of truth"],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />

      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[0.92fr,1.08fr] gap-6">
            <div className="glass rounded-[2rem] p-6 md:p-7">
              <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                Product Upgrade
              </p>
              <h2 className="text-3xl font-bold text-white mt-4">
                A more honest and complete OnlyPaca.
              </h2>
              <p className="text-dark-300 mt-4">
                The current upgrade focuses on productization: fewer conceptual dead ends, clearer
                privacy boundaries, and end-to-end flows that align with what the contracts and
                relayer actually do today.
              </p>

              <div className="space-y-3 mt-6">
                {[
                  "Relay success no longer pretends content is already unlocked.",
                  "Subscription memory is treated as a local helper layer, not chain truth.",
                  "Fhenix asynchronous decrypt behavior is reflected directly in the UX.",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/8 bg-dark-900/40 p-4 text-sm text-dark-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {journeyCards.map((card) => (
                <div key={card.title} className="glass rounded-[2rem] p-6">
                  <h3 className="text-white text-lg font-semibold">{card.title}</h3>
                  <p className="text-dark-400 text-sm mt-3">{card.description}</p>
                  <div className="space-y-2 mt-5">
                    {card.points.map((point) => (
                      <div key={point} className="rounded-2xl border border-white/8 bg-dark-900/50 px-4 py-3 text-sm text-dark-300">
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <CreatorScroll />
      <CTASection />
      <Footer />
    </main>
  );
}
