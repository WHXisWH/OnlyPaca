"use client";

import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Subtle background radials */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 text-center">
        {/* Logo mark */}
        <div className="flex justify-center mb-10">
          <Image
            src="/logo.png"
            alt="OnlyPaca"
            width={120}
            height={120}
            className="object-contain drop-shadow-[0_0_30px_rgba(255,26,108,0.4)]"
          />
        </div>

        {/* Editorial headline — big, bold, minimal */}
        <h1 className="font-bold leading-[0.95] tracking-tight mb-8">
          <span className="block text-[clamp(3rem,10vw,8rem)] text-white">
            Your secret.
          </span>
          <span className="block text-[clamp(3rem,10vw,8rem)] gradient-text">
            Encrypted.
          </span>
        </h1>

        {/* One line, not a paragraph */}
        <p className="text-lg sm:text-xl text-dark-400 mb-12 max-w-xl mx-auto">
          The first adult platform where your subscriptions are mathematically private —
          not just promised.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
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
            Start Earning
          </Link>
        </div>

        {/* Minimal stats row */}
        <div className="flex items-center justify-center gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-white">0%</div>
            <div className="text-xs text-dark-500 uppercase tracking-widest mt-1">Data Exposed</div>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div>
            <div className="text-3xl font-bold text-white">FHE</div>
            <div className="text-xs text-dark-500 uppercase tracking-widest mt-1">Encrypted</div>
          </div>
          <div className="w-px h-8 bg-dark-700" />
          <div>
            <div className="text-3xl font-bold text-white">5%</div>
            <div className="text-xs text-dark-500 uppercase tracking-widest mt-1">Fee Only</div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-white" />
      </div>
    </section>
  );
}
