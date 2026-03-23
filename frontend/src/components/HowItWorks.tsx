"use client";

import { FadeIn } from "./FadeIn";

function EIP712Mock() {
  return (
    <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 font-mono text-xs">
      <div className="text-primary-400 mb-2">// EIP-712 typed data — wallet only</div>
      <div>
        <span className="text-sky-400">creator:</span>{" "}
        <span className="text-green-400">0xCreator…</span>
      </div>
      <div>
        <span className="text-sky-400">subscriber:</span>{" "}
        <span className="text-green-400">0xYou…</span>
      </div>
      <div>
        <span className="text-sky-400">deadline:</span>{" "}
        <span className="text-amber-400">1743290400</span>
      </div>
      <div className="mt-3 text-green-400 text-[11px]">
        ✓ Signed locally — never broadcast
      </div>
    </div>
  );
}

function RelayerMock() {
  return (
    <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 font-mono text-xs">
      <div className="text-primary-400 mb-2">// Arbiscan — what the chain sees</div>
      <div>
        <span className="text-sky-400">From:</span>{" "}
        <span className="text-red-400">0xRelayer… (not you)</span>
      </div>
      <div>
        <span className="text-sky-400">To:</span>{" "}
        <span className="text-green-400">OnlyFHESubscription</span>
      </div>
      <div>
        <span className="text-sky-400">Method:</span>{" "}
        <span className="text-amber-400">activateSubscription()</span>
      </div>
      <div className="mt-3 text-green-400 text-[11px]">
        ✓ Your wallet: never appears
      </div>
    </div>
  );
}

function FHEMock() {
  return (
    <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 font-mono text-xs">
      <div className="text-primary-400 mb-2">// Contract storage slot — public</div>
      <div>
        <span className="text-sky-400">_subscriptions[C][S]:</span>
      </div>
      <div className="pl-4 text-dark-500 break-all">
        0x3f7a9c2e8b1d…
        <span className="text-dark-600">(euint8 ciphertext)</span>
      </div>
      <div className="mt-2">
        <span className="text-sky-400">_creatorRevenue[C]:</span>
      </div>
      <div className="pl-4 text-dark-500 break-all">
        0xa1f2d8e4c3b9…
        <span className="text-dark-600">(euint64 ciphertext)</span>
      </div>
      <div className="mt-3 text-green-400 text-[11px]">
        ✓ Anyone can read this. Nobody can decrypt it.
      </div>
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "You sign. Nothing hits chain.",
    subtitle: "EIP-712 off-chain signature",
    desc: "You authorize a subscription with a wallet signature. No gas. No on-chain trace. Your address never touches the contract.",
    mock: <EIP712Mock />,
  },
  {
    num: "02",
    title: "Relayer submits. Not you.",
    subtitle: "msg.sender = Relayer",
    desc: "Our Relayer takes your signature, pays gas, and submits the transaction. On-chain, the call comes from the Relayer — your wallet is invisible.",
    mock: <RelayerMock />,
  },
  {
    num: "03",
    title: "FHE encrypts everything at rest.",
    subtitle: "euint8 + euint64 on-chain",
    desc: "The contract writes your subscription as a ciphertext. Creator revenue adds up as ciphertext. Even we cannot read these values — only you can decrypt your own data.",
    mock: <FHEMock />,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-4">
              How It Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold">
              <span className="text-white">Three layers of protection,</span>
              <br />
              <span className="gradient-text">working simultaneously.</span>
            </h2>
          </div>
        </FadeIn>

        {/* Steps with code mocks */}
        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 120}>
              <div
                className={`grid md:grid-cols-2 gap-8 items-center bg-dark-800/30 border border-dark-700 rounded-2xl p-8 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Text content */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-primary-400 font-mono bg-primary-500/10 px-2 py-1 rounded">
                      {step.num}
                    </span>
                    <span className="text-xs text-dark-500 uppercase tracking-wider">
                      {step.subtitle}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-dark-400 leading-relaxed">{step.desc}</p>
                </div>

                {/* Code mock */}
                <div>{step.mock}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
