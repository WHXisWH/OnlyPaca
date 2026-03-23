"use client";

import Link from "next/link";
import { FadeIn } from "./FadeIn";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to subscribe <span className="gradient-text">privately</span>?
            </h2>
            <p className="text-dark-400 text-lg mb-8 max-w-xl mx-auto">
              No wallet trace. No public record. Just you and your favorite creators.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/explore"
                className="px-10 py-4 bg-primary-500 hover:bg-primary-400 rounded-full font-semibold text-white text-base transition-all hover:scale-105 shadow-lg shadow-primary-500/30"
              >
                Explore Creators
              </Link>
              <Link
                href="/dashboard/creator"
                className="px-10 py-4 rounded-full font-semibold text-white text-base border border-white/15 hover:border-white/30 hover:bg-white/5 transition-all"
              >
                Become a Creator
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
