"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-dark-800/60">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="OnlyPaca" width={48} height={48} className="object-contain" />
            <div>
              <div className="text-white font-bold text-lg">
                Only<span className="text-primary-300">Paca</span>
              </div>
              <div className="text-dark-500 text-xs mt-0.5">
                Productized privacy on top of Fhenix CoFHE.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-dark-400">
            <Link href="/explore" className="hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/status" className="hover:text-white transition-colors">
              System Status
            </Link>
            <Link href="/dashboard/subscriptions" className="hover:text-white transition-colors">
              Private Vault
            </Link>
            <Link href="/dashboard/creator" className="hover:text-white transition-colors">
              Creator Studio
            </Link>
            <a
              href="https://www.fhenix.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Fhenix Protocol
            </a>
            <a
              href="https://docs.fhenix.zone/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              CoFHE Docs
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-800/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-dark-600">
          <span>2026 OnlyPaca. Creator subscriptions with explicit privacy boundaries.</span>
          <span>Contracts on Arbitrum Sepolia | Powered by CoFHE</span>
        </div>
      </div>
    </footer>
  );
}
