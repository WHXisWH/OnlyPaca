"use client";

import { useState, useEffect, useRef, ReactNode } from "react";

// Fade-in animation wrapper using Intersection Observer
function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="transition-all duration-600"
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
}

// Problem data
const web2Problems = [
  {
    icon: "🏦",
    title: "Platform owns your data",
    body: "OnlyFans can sell your subscriber list, freeze your account overnight, or hand data to authorities — no cryptographic protection exists.",
  },
  {
    icon: "💳",
    title: "Payment processors can censor",
    body: "Visa and MasterCard have repeatedly forced platforms to purge content. The creator has zero recourse.",
  },
  {
    icon: "📊",
    title: "Your revenue is their leverage",
    body: "The platform knows exactly how much you earn. That's why every negotiation on fee splits goes their way.",
  },
];

const onchainProblems = [
  {
    icon: "🔍",
    title: "Subscriptions are public forever",
    body: "tx.from → CreatorContract is permanently on-chain. Anyone with Etherscan can build a social graph of your fans.",
  },
  {
    icon: "📈",
    title: "Revenue is a public scoreboard",
    body: "Competitors can watch your earnings in real-time and undercut your pricing the moment you find a working niche.",
  },
  {
    icon: "👁️",
    title: "Withdrawal deanonymizes creators",
    body: "Even if state is hidden, a 5 ETH transfer to your wallet every month tells the whole story.",
  },
];

export function ProblemSection() {
  const [activeTab, setActiveTab] = useState<"web2" | "onchain">("web2");
  const problems = activeTab === "web2" ? web2Problems : onchainProblems;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-4">
              The Problem
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white">Web2 betrays you.</span>
              <br />
              <span className="gradient-text">Naked on-chain is worse.</span>
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
              Moving creator economy to blockchain solves the censorship problem.
              But it creates a privacy catastrophe that makes things measurably
              worse for everyone involved.
            </p>
          </div>
        </FadeIn>

        {/* Tab toggle */}
        <FadeIn delay={100}>
          <div className="flex justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTab("web2")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "web2"
                  ? "bg-primary-500/15 border border-primary-500 text-primary-400"
                  : "border border-dark-700 text-dark-400 hover:border-dark-500"
              }`}
            >
              Web2 (OnlyFans)
            </button>
            <button
              onClick={() => setActiveTab("onchain")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === "onchain"
                  ? "bg-primary-500/15 border border-primary-500 text-primary-400"
                  : "border border-dark-700 text-dark-400 hover:border-dark-500"
              }`}
            >
              Naked On-chain
            </button>
          </div>
        </FadeIn>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {problems.map((problem, i) => (
            <FadeIn key={problem.title} delay={i * 80}>
              <div className="bg-dark-800/50 border border-dark-700 rounded-2xl p-6 h-full hover:border-dark-600 transition-colors">
                <div className="text-3xl mb-4">{problem.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {problem.title}
                </h3>
                <p className="text-dark-400 text-sm leading-relaxed">
                  {problem.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
