"use client";

const points = [
  {
    num: "01",
    title: "No one knows who you follow.",
    body: "Subscription relationships are stored on-chain as encrypted ciphertext. Your wallet is never linked to any creator — not by us, not by anyone.",
  },
  {
    num: "02",
    title: "Creators keep earnings to themselves.",
    body: "Revenue accumulates encrypted. Competitors see only noise. You choose what to reveal — nothing, a range, or everything.",
  },
  {
    num: "03",
    title: "Payments look like regular ETH transfers.",
    body: "Transactions go through a Relayer. On-chain, your wallet never touches the subscription contract.",
  },
  {
    num: "04",
    title: "Math enforces it. Policy can't override it.",
    body: "Fully Homomorphic Encryption computes on ciphertext without decrypting. Even we are cryptographically locked out.",
  },
];

export function Features() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Editorial header */}
        <div className="mb-20">
          <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-6">Why OnlyPaca</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Privacy that actually<br />
            <span className="gradient-text">means something.</span>
          </h2>
        </div>

        {/* Editorial list — numbered, generous spacing */}
        <div className="divide-y divide-dark-800">
          {points.map((p) => (
            <div key={p.num} className="py-10 grid grid-cols-12 gap-6 group hover:opacity-100 transition-opacity">
              {/* Number */}
              <div className="col-span-2 sm:col-span-1">
                <span className="text-dark-700 text-sm font-mono group-hover:text-primary-500 transition-colors">
                  {p.num}
                </span>
              </div>

              {/* Content */}
              <div className="col-span-10 sm:col-span-11 grid sm:grid-cols-2 gap-4 items-start">
                <h3 className="text-xl sm:text-2xl font-semibold text-white leading-snug">
                  {p.title}
                </h3>
                <p className="text-dark-400 leading-relaxed">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison callout — minimal */}
        <div className="mt-20 pt-12 border-t border-dark-800">
          <div className="grid sm:grid-cols-2 gap-12">
            <div>
              <p className="text-dark-600 text-xs uppercase tracking-widest mb-4">The old way</p>
              <p className="text-dark-400 leading-relaxed">
                Platform sees everything. Payment processors record it. Subscription history is permanent and public. Privacy is a promise that can be broken.
              </p>
            </div>
            <div>
              <p className="text-primary-500 text-xs uppercase tracking-widest mb-4">OnlyPaca</p>
              <p className="text-white leading-relaxed">
                Encrypted on-chain. Relayer breaks the link. No platform access. Privacy is a cryptographic property — not a policy.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
