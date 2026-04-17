"use client";

import Link from "next/link";
import Image from "next/image";

const signalCards = [
  {
    title: "Private checkout",
    body: "Fans sign a message. The relayer pays gas and submits the transaction.",
  },
  {
    title: "Encrypted access state",
    body: "Subscription relationships are stored as FHE ciphertext, not a public edge list.",
  },
  {
    title: "Creator-only revenue visibility",
    body: "Revenue accumulates privately and only the creator can ask CoFHE to decrypt it.",
  },
];

export function Hero() {
  return (
    <section className="relative min-h-screen pt-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,113,133,0.18),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(251,146,60,0.12),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.03),transparent_30%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-[1.15fr,0.9fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary-200">
              <span>Fhenix CoFHE</span>
              <span className="text-dark-500">|</span>
              <span>Arbitrum Sepolia</span>
            </div>

            <h1 className="mt-8 text-[clamp(3.1rem,9vw,7.2rem)] leading-[0.92] font-bold tracking-tight">
              <span className="block text-white">Private creator</span>
              <span className="block gradient-text">subscriptions</span>
              <span className="block text-white">that feel like a product.</span>
            </h1>

            <p className="text-lg sm:text-xl text-dark-300 mt-6 max-w-2xl">
              OnlyPaca is not just a privacy thesis anymore. It is a full Fhenix-native journey:
              creator discovery, private relay checkout, explicit FHE verification, and creator
              revenue that only the creator can reveal.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
              <Link
                href="/explore"
                className="w-full sm:w-auto px-10 py-4 bg-primary-500 hover:bg-primary-400 rounded-2xl font-semibold text-white text-base transition-all hover:scale-[1.02] shadow-lg shadow-primary-500/20 text-center"
              >
                Start as a Fan
              </Link>
              <Link
                href="/dashboard/creator"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-semibold text-white text-base border border-white/12 hover:border-white/30 hover:bg-white/5 transition-all text-center"
              >
                Launch Creator Studio
              </Link>
              <Link
                href="/dashboard/subscriptions"
                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-semibold text-dark-200 text-base border border-transparent bg-white/5 hover:bg-white/10 transition-all text-center"
              >
                Open Private Vault
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-12">
              {signalCards.map((card) => (
                <div key={card.title} className="glass rounded-[1.6rem] p-5">
                  <div className="text-white font-semibold">{card.title}</div>
                  <div className="text-dark-400 text-sm mt-2">{card.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 right-10 w-32 h-32 bg-primary-500/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-4 w-28 h-28 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

            <div className="glass rounded-[2rem] p-6 md:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                    Product Signal
                  </p>
                  <h2 className="text-2xl font-bold text-white mt-3">
                    From marketing page to usable privacy workflow.
                  </h2>
                </div>
                <Image
                  src="/logo.png"
                  alt="OnlyPaca"
                  width={68}
                  height={68}
                  className="object-contain drop-shadow-[0_0_20px_rgba(251,113,133,0.4)]"
                />
              </div>

              <div className="space-y-4 mt-8">
                {[
                  {
                    title: "Fan journey",
                    body: "Explore a creator, sign privately, then explicitly verify access with CoFHE before opening content.",
                  },
                  {
                    title: "Creator journey",
                    body: "Register on-chain, set a content URL, reveal revenue privately, and withdraw without making earnings public.",
                  },
                  {
                    title: "Protocol honesty",
                    body: "Private subscriber lists are not publicly enumerable. The UI now says that clearly instead of pretending otherwise.",
                  },
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl border border-primary-500/20 bg-primary-500/10 text-primary-300 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                      0{index + 1}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{item.title}</div>
                      <div className="text-dark-400 text-sm mt-1">{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-8">
                {[
                  { value: "Relayer", label: "Caller seen on-chain" },
                  { value: "FHE", label: "Access state at rest" },
                  { value: "~5-30s", label: "Async decrypt loop" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/8 bg-dark-900/50 p-4 text-center">
                    <div className="text-white text-xl font-bold">{item.value}</div>
                    <div className="text-dark-400 text-xs mt-2">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
