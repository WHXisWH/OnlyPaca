"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscriptionCard } from "@/components/SubscriptionCard";

export default function SubscriptionsDashboardPage() {
  const { isConnected } = useAccount();
  const { subscriptions, isLoading, verifyAccess, isVerifying } = useSubscriptions();

  if (!isConnected) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-dark-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-dark-400 mb-8">
              Connect your wallet to view your subscriptions.
            </p>
            <ConnectButton />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">My Subscriptions</h1>
              <p className="text-dark-400 mt-1">
                View and verify your subscription access
              </p>
            </div>
            <Link
              href="/explore"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white font-semibold transition-colors"
            >
              Find Creators
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-dark-400">Loading subscriptions...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && subscriptions.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-dark-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No Subscriptions Yet
              </h2>
              <p className="text-dark-400 mb-6">
                Subscribe to creators to unlock their exclusive content
              </p>
              <Link
                href="/explore"
                className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-semibold transition-colors"
              >
                Explore Creators
              </Link>
            </div>
          )}

          {/* Subscriptions List */}
          {!isLoading && subscriptions.length > 0 && (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.creatorAddress}
                  subscription={subscription}
                  onVerify={() => verifyAccess(subscription.creatorAddress)}
                  isVerifying={isVerifying === subscription.creatorAddress}
                />
              ))}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-8 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h4 className="text-primary-400 font-semibold">
                  Privacy-First Access Verification
                </h4>
                <p className="text-dark-300 text-sm mt-1">
                  Your subscription status is encrypted on-chain. When you click
                  &quot;Verify Access&quot;, the FHE coprocessor decrypts your status for
                  your eyes only. The creator cannot see who their subscribers are.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
