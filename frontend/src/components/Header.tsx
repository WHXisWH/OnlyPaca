"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="OnlyPaca"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              Only<span className="text-primary-400">Paca</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-dark-300 hover:text-white transition-colors text-sm">
              Explore
            </Link>
            <Link href="/dashboard" className="text-dark-300 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
            <Link href="/dashboard/creator" className="text-dark-300 hover:text-white transition-colors text-sm">
              For Creators
            </Link>
          </nav>

          {/* Wallet */}
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
