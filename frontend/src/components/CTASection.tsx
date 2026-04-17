"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="glass rounded-[2rem] p-8 md:p-10 text-center">
            <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
              Next Step
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
              Pick the path you want to test end to end.
            </h2>
            <p className="text-dark-300 text-lg mt-4 max-w-2xl mx-auto">
              Fans can run the private subscription and access verification flow today. Creators can
              register, publish a content URL, and privately reveal revenue from the dashboard.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left">
              {[
                "Explore live creator profiles",
                "Open your browser-private vault",
                "Launch creator studio and register on-chain",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-dark-900/45 p-4 text-sm text-dark-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                href="/explore"
                className="px-10 py-4 bg-primary-500 hover:bg-primary-400 rounded-2xl font-semibold text-white text-base transition-all hover:scale-[1.02] shadow-lg shadow-primary-500/20"
              >
                Explore Creators
              </Link>
              <Link
                href="/dashboard/subscriptions"
                className="px-10 py-4 rounded-2xl font-semibold text-white text-base border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                Open Private Vault
              </Link>
              <Link
                href="/dashboard/creator"
                className="px-10 py-4 rounded-2xl font-semibold text-dark-200 text-base bg-white/5 hover:bg-white/10 transition-all"
              >
                Creator Studio
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
