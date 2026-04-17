"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SystemStatusPanel } from "@/components/SystemStatusPanel";

export default function StatusPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
              Operations
            </p>
            <h1 className="text-4xl font-bold text-white mt-3">System Status</h1>
            <p className="text-dark-400 mt-3 max-w-3xl">
              This page exposes the actual runtime readiness behind OnlyPaca: relayer API reachability,
              deployed contract checks, relayer authorization, and whether the connected wallet is
              on the correct chain for private actions.
            </p>
          </div>

          <SystemStatusPanel
            title="Live Private Flow Readiness"
            description="The frontend combines relayer self-health with direct on-chain reads so the product can show real readiness instead of a generic green dot."
          />
        </div>
      </div>

      <Footer />
    </main>
  );
}
