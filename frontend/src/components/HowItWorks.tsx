"use client";

import { FadeIn } from "./FadeIn";

const steps = [
  {
    num: "01",
    title: "Authorize privately",
    subtitle: "EIP-712 signature",
    desc: "The fan signs typed data locally. This starts the flow without making a direct subscription contract call from the wallet.",
    bullets: [
      "No public subscriber list is created from this step.",
      "The signature includes nonce and deadline to prevent replay.",
    ],
  },
  {
    num: "02",
    title: "Relayer pays gas and submits",
    subtitle: "Relayer-first execution",
    desc: "The relayer backend validates the signature and funds the actual transaction. Arbiscan sees the relayer as the caller.",
    bullets: [
      "The product flow stays usable for fans who should not need to manage gas for every action.",
      "The relayer is separated from decryption permissions, so it cannot read encrypted state.",
    ],
  },
  {
    num: "03",
    title: "CoFHE resolves access asynchronously",
    subtitle: "Fhenix-native UX",
    desc: "Subscriptions and creator revenue live on-chain as ciphertext. When a user wants to unlock content or reveal earnings, CoFHE performs an explicit decrypt request and the UI polls for readiness.",
    bullets: [
      "This asynchronous loop is a product feature, not a hidden implementation detail.",
      "Only the authorized wallet can read the result of the decrypt operation.",
    ],
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-dark-500 text-xs uppercase tracking-[0.3em] mb-4">
              System Design
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold">
              <span className="text-white">Designed around the real</span>
              <br />
              <span className="gradient-text">Fhenix execution model.</span>
            </h2>
            <p className="text-dark-300 max-w-3xl mx-auto mt-6">
              We removed the mock-style explainers and replaced them with the product realities the
              UI now embraces: relayer-first execution, encrypted state at rest, and an explicit
              asynchronous decryption loop.
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-[1.2fr,0.95fr] gap-6 items-start">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <FadeIn key={step.num} delay={index * 90}>
                <div className="glass rounded-[2rem] p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-bold text-primary-300 font-mono bg-primary-500/10 px-3 py-1 rounded-full">
                      {step.num}
                    </span>
                    <span className="text-xs text-dark-500 uppercase tracking-wider">
                      {step.subtitle}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  <p className="text-dark-300 leading-relaxed mt-3">{step.desc}</p>
                  <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    {step.bullets.map((bullet) => (
                      <div key={bullet} className="rounded-2xl border border-white/8 bg-dark-900/50 p-4 text-sm text-dark-300">
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={240}>
            <div className="glass rounded-[2rem] p-6 md:p-7 sticky top-24">
              <p className="text-primary-300 text-xs uppercase tracking-[0.3em]">
                Product Consequences
              </p>
              <div className="space-y-4 mt-6">
                {[
                  {
                    title: "Private Vault instead of fake subscription index",
                    body: "The dashboard now stores your own journey locally and tells you why it cannot publicly enumerate private subscriptions.",
                  },
                  {
                    title: "Relay success is not presented as final unlock",
                    body: "Users are now told they still need an explicit FHE verification step before content is shown.",
                  },
                  {
                    title: "Creator revenue remains opt-in visible",
                    body: "Revenue decryption and withdrawal are treated as separate privacy-preserving actions in the creator journey.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/8 bg-dark-900/40 p-5">
                    <div className="text-white font-semibold">{item.title}</div>
                    <div className="text-dark-400 text-sm mt-2">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
