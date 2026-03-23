"use client";

import { FadeIn } from "./FadeIn";

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const rows = [
  {
    label: "Subscriber identity",
    web2: "Platform sees all",
    naked: "Fully public",
    fhe: "Encrypted — nobody knows",
  },
  {
    label: "Subscription relationship",
    web2: "Database record",
    naked: "On-chain forever",
    fhe: "FHE ciphertext only",
  },
  {
    label: "Creator earnings",
    web2: "Platform sees all",
    naked: "Public balance",
    fhe: "euint64 — creator-eyes only",
  },
  {
    label: "Payment censorship",
    web2: "Visa / bank risk",
    naked: "Permissionless",
    fhe: "Permissionless",
  },
  {
    label: "Account freeze risk",
    web2: "Anytime",
    naked: "None",
    fhe: "None",
  },
  {
    label: "Platform data leverage",
    web2: "Total",
    naked: "Total (public chain)",
    fhe: "Zero — math enforces it",
  },
];

export function ComparisonTable() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-dark-900/40">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-4">
              Why FHE
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold">
              <span className="text-white">The only solution that solves </span>
              <span className="gradient-text">both problems</span>
            </h2>
          </div>
        </FadeIn>

        {/* Mobile scroll hint */}
        <FadeIn delay={80}>
          <div className="md:hidden flex items-center justify-center gap-2 mb-4 text-dark-500 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            <span>Swipe to see full comparison</span>
          </div>
        </FadeIn>

        {/* Comparison table */}
        <FadeIn delay={100}>
          <div className="overflow-x-auto rounded-xl border border-dark-700 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-4 py-4 text-left text-dark-400 font-medium">
                    Property
                  </th>
                  <th className="px-4 py-4 text-center text-red-400 font-semibold whitespace-nowrap">
                    Web2 (OnlyFans)
                  </th>
                  <th className="px-4 py-4 text-center text-yellow-400 font-semibold whitespace-nowrap">
                    Naked On-chain
                  </th>
                  <th className="px-4 py-4 text-center text-green-400 font-semibold whitespace-nowrap">
                    OnlyPaca (FHE)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`${i % 2 === 0 ? "bg-dark-800/30" : ""} border-b border-dark-800 last:border-0`}
                  >
                    <td className="px-4 py-4 text-dark-200 font-medium">
                      {row.label}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 text-red-400">
                        <XIcon />
                        <span className="text-xs">{row.web2}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <XIcon />
                        <span className="text-xs">{row.naked}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckIcon />
                        <span className="text-xs">{row.fhe}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        {/* Key insight callout */}
        <FadeIn delay={200}>
          <div className="mt-8 p-6 bg-primary-500/10 border border-primary-500/25 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0 text-primary-400">
                <LockIcon />
              </div>
              <div>
                <p className="font-semibold text-primary-400 mb-1">
                  Without FHE, this product doesn&apos;t exist.
                </p>
                <p className="text-dark-400 text-sm leading-relaxed">
                  Remove FHE and replace with a regular mapping — any script can
                  enumerate every creator, query every subscriber, and reconstruct
                  a permanent social graph. NFT gating, ZK proofs, and token-gating
                  all fail here because they prove membership without hiding the
                  relationship. Only FHE computes on the subscription state while
                  keeping it permanently encrypted on-chain.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
