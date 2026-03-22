"use client";

const steps = [
  {
    n: "1",
    title: "Connect wallet",
    desc: "Your wallet is only used to sign messages — it never submits transactions to the platform.",
  },
  {
    n: "2",
    title: "Pick a creator",
    desc: "Browse public profiles: price, subscriber count, content preview. No subscription history is visible.",
  },
  {
    n: "3",
    title: "Sign off-chain",
    desc: "You sign an EIP-712 authorization. No gas. No on-chain trace from your wallet.",
  },
  {
    n: "4",
    title: "Relayer submits",
    desc: "Our Relayer posts the transaction. On-chain, msg.sender is the Relayer — never you.",
  },
  {
    n: "5",
    title: "FHE unlocks content",
    desc: "The contract verifies access using encrypted state. Only you can decrypt your own subscription status.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 bg-dark-900/40">
      <div className="max-w-5xl mx-auto">
        <div className="mb-20">
          <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-6">The Flow</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Five steps.<br />
            <span className="gradient-text">Zero exposure.</span>
          </h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-dark-800 hidden sm:block" />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="relative sm:pl-16 py-8 group">
                {/* Circle */}
                <div className="hidden sm:flex absolute left-0 top-8 w-10 h-10 rounded-full border border-dark-700 bg-dark-950 items-center justify-center group-hover:border-primary-500 group-hover:bg-primary-500/10 transition-all">
                  <span className="text-dark-500 text-sm font-mono group-hover:text-primary-400 transition-colors">
                    {step.n}
                  </span>
                </div>

                {/* Content */}
                <div className="grid sm:grid-cols-2 gap-3 items-baseline">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <span className="sm:hidden text-dark-600 text-sm font-mono">{step.n}.</span>
                    {step.title}
                  </h3>
                  <p className="text-dark-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
