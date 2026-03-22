"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeModal } from "@/components/SubscribeModal";
import { useCreator } from "@/hooks/useCreators";

export default function CreatorProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();

  const { creator, isLoading, error } = useCreator(address);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  if (isLoading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !creator) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-white mb-4">Creator Not Found</h1>
          <p className="text-dark-400">
            This creator has not registered on OnlyFHE yet.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  const priceInEth = formatEther(BigInt(creator.subscriptionPrice));
  const isOwnProfile = userAddress?.toLowerCase() === creator.address.toLowerCase();

  return (
    <main className="min-h-screen">
      <Header />

      {/* Banner */}
      <div className="pt-16 h-64 bg-gradient-to-br from-primary-600/30 to-purple-600/30 relative">
        {creator.banner && (
          <img
            src={creator.banner}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-2xl bg-dark-800 border-4 border-dark-950 overflow-hidden flex-shrink-0">
            {creator.avatar ? (
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {creator.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{creator.name}</h1>
            <p className="text-dark-400 mt-1 text-sm font-mono">
              {creator.address.slice(0, 6)}...{creator.address.slice(-4)}
            </p>
            <p className="text-dark-300 mt-4">{creator.bio || "No bio yet"}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div>
                <div className="text-2xl font-bold text-white">
                  {creator.subscriberCount}
                </div>
                <div className="text-dark-400 text-sm">Subscribers</div>
              </div>
              <div className="w-px h-10 bg-dark-700" />
              <div>
                <div className="text-2xl font-bold text-primary-400">
                  {parseFloat(priceInEth).toFixed(4)} ETH
                </div>
                <div className="text-dark-400 text-sm">per month</div>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            {isOwnProfile ? (
              <a
                href="/dashboard/creator"
                className="block w-full sm:w-auto px-6 py-3 glass rounded-xl text-center text-white font-semibold hover:bg-white/10 transition-all"
              >
                View Dashboard
              </a>
            ) : (
              <button
                onClick={() => setShowSubscribeModal(true)}
                disabled={!isConnected}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isConnected ? "Subscribe" : "Connect Wallet to Subscribe"}
              </button>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 glass rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-400"
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
            <div>
              <h3 className="text-white font-semibold">Privacy Protected</h3>
              <p className="text-dark-400 text-sm mt-1">
                Your subscription is encrypted using FHE. No one can see that you
                subscribed to this creator — not even us. Only you can verify your
                own access status.
              </p>
            </div>
          </div>
        </div>

        {/* Content Preview Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Content</h2>
          <div className="glass rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-dark-400"
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
            <h3 className="text-lg font-semibold text-white mb-2">
              Exclusive Content
            </h3>
            <p className="text-dark-400 mb-4">
              Subscribe to unlock exclusive content from {creator.name}
            </p>
            {!isOwnProfile && (
              <button
                onClick={() => setShowSubscribeModal(true)}
                disabled={!isConnected}
                className="px-6 py-2 bg-primary-500/20 border border-primary-500 rounded-lg text-primary-400 font-semibold hover:bg-primary-500/30 transition-all disabled:opacity-50"
              >
                Unlock for {parseFloat(priceInEth).toFixed(4)} ETH
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        creator={creator}
      />

      <Footer />
    </main>
  );
}
