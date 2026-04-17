"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navItems = [
  { href: "/explore", label: "Explore" },
  { href: "/status", label: "System Status" },
  { href: "/dashboard/subscriptions", label: "Private Vault" },
  { href: "/dashboard/creator", label: "Creator Studio" },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-950/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="OnlyPaca" width={40} height={40} className="object-contain" />
            <div>
              <span className="text-xl font-bold text-white tracking-tight">
                Only<span className="text-primary-300">Paca</span>
              </span>
              <div className="hidden sm:block text-[10px] uppercase tracking-[0.28em] text-dark-500">
                Fhenix Private UX
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-dark-300 hover:text-white transition-colors text-sm"
              >
                {item.label}
              </Link>
            ))}
            <span className="text-[10px] uppercase tracking-[0.25em] text-dark-500 border border-white/8 rounded-full px-3 py-1">
              Arbitrum Sepolia
            </span>
          </nav>

          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
      </div>
    </header>
  );
}
