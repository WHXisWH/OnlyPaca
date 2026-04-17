"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscriptionCard } from "@/components/SubscriptionCard";

export default function SubscriptionsDashboardPage() {
  const { isConnected } = useAccount();
  const {
    subscriptions,
    isLoading,
    verifyAccess,
    isVerifying,
    verifyStep,
    usesPrivateVault,
  } = useSubscriptions();

  if (!isConnected) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-dark-400 mb-8">
              Connect your wallet to open your Private Vault and verify access.
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
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
            <div>
              <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                Dashboard
              </p>
              <h1 className="text-3xl font-bold text-white mt-3">Private Vault</h1>
              <p className="text-dark-400 mt-2 max-w-2xl">
                This page is intentionally not a public subscription index. It is a browser-private
                workspace that remembers creators you interacted with and lets you re-run FHE access
                verification on demand.
              </p>
            </div>
            <Link
              href="/explore"
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-semibold transition-colors text-center"
            >
              Explore Creators
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1.35fr,0.9fr] gap-4 mb-8">
            <div className="glass rounded-[2rem] p-6">
              <h2 className="text-white text-lg font-semibold">Why this page is local-first</h2>
              <div className="grid md:grid-cols-3 gap-3 mt-5">
                {[
                  {
                    title: "No public subscriber list",
                    body: "The protocol intentionally omits subscriber identities from events and public views.",
                  },
                  {
                    title: "Your browser remembers your journey",
                    body: "Successful relay attempts are stored locally so you can continue the unlock flow later.",
                  },
                  {
                    title: "Chain truth still wins",
                    body: "Every unlock runs a fresh FHE verification against the contract before content opens.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/8 bg-dark-900/40 p-4">
                    <div className="text-white text-sm font-semibold">{item.title}</div>
                    <div className="text-dark-400 text-sm mt-2">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6">
              <h2 className="text-white text-lg font-semibold">Verification loop</h2>
              <div className="space-y-3 mt-4 text-sm text-dark-300">
                <div>1. Pick a creator from your Private Vault.</div>
                <div>2. Sign an access request. No direct contract call from your wallet is shown.</div>
                <div>3. The relayer submits the request and CoFHE resolves the decrypt asynchronously.</div>
                <div>4. Only after a successful result do you open the content link.</div>
              </div>
              {usesPrivateVault && (
                <div className="mt-4 rounded-2xl border border-primary-500/20 bg-primary-500/10 p-4 text-sm text-primary-200">
                  Your vault entries live in this browser only. If you change devices or clear storage,
                  you can still verify access again from the creator page, but the remembered list here
                  will not follow you.
                </div>
              )}
            </div>
          </div>

          {verifyStep && (
            <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-primary-300 text-sm">{verifyStep}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-dark-400">Loading your Private Vault...</span>
            </div>
          )}

          {!isLoading && subscriptions.length === 0 && (
            <div className="text-center py-20 glass rounded-[2rem]">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No private entries yet</h2>
              <p className="text-dark-400 mb-6 max-w-xl mx-auto">
                Subscribe to a creator or finish a relay flow and this browser will keep a private
                record here. That record is a convenience layer only; access still gets re-verified
                against the FHE contract whenever needed.
              </p>
              <Link
                href="/explore"
                className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-semibold transition-colors"
              >
                Explore Creators
              </Link>
            </div>
          )}

          {!isLoading && subscriptions.length > 0 && (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.creatorAddress}
                  subscription={subscription}
                  onVerify={() => verifyAccess(subscription.creatorAddress)}
                  isVerifying={isVerifying === subscription.creatorAddress}
                  verifyStep={isVerifying === subscription.creatorAddress ? verifyStep : null}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
