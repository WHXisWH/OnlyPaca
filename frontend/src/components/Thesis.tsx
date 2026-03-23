"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

// Fade-in animation wrapper
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

// Eye icon
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

export function Thesis() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center p-10 sm:p-16 bg-gradient-to-br from-primary-500/10 to-indigo-500/10 border border-primary-500/20 rounded-3xl">
            <p className="text-dark-500 text-xs uppercase tracking-[0.2em] mb-6">
              The Thesis
            </p>
            <blockquote className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white leading-relaxed italic mb-8">
              &ldquo;Creator economies belong on-chain. But public ledgers are
              incompatible with sensitive relationships. FHE is the only primitive
              that makes both statements simultaneously true.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400">
                <EyeIcon />
              </div>
              <span className="text-dark-400 text-sm">
                The subscription exists on-chain. But only you can see it.
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
