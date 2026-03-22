"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCreatorDashboard } from "@/hooks/useCreatorDashboard";

export default function CreatorDashboardPage() {
  const { isConnected, address } = useAccount();
  const {
    profile,
    isLoading,
    isRegistered,
    revenue,
    isDecryptingRevenue,
    registerCreator,
    requestRevenueDecrypt,
    withdrawRevenue,
    isRegistering,
    isWithdrawing,
  } = useCreatorDashboard();

  // Registration form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    price: "0.01",
    payoutAddress: "",
  });

  // Set payout address to connected wallet by default
  useEffect(() => {
    if (address && !formData.payoutAddress) {
      setFormData((prev) => ({ ...prev, payoutAddress: address }));
    }
  }, [address, formData.payoutAddress]);

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
              Connect your wallet to access your creator dashboard.
            </p>
            <ConnectButton />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerCreator({
      name: formData.name,
      bio: formData.bio,
      subscriptionPrice: parseEther(formData.price),
      payoutAddress: formData.payoutAddress as `0x${string}`,
    });
  };

  // Not registered - show registration form
  if (!isRegistered) {
    return (
      <main className="min-h-screen">
        <Header />

        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Become a Creator</h1>
              <p className="text-dark-400 mt-2">
                Start earning with complete privacy. Your revenue is encrypted
                on-chain.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="glass rounded-2xl p-6">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your creator name"
                    required
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Tell subscribers about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Subscription Price (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                      className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">
                      ETH
                    </span>
                  </div>
                  <p className="text-dark-400 text-sm mt-1">
                    5% platform fee applies
                  </p>
                </div>

                {/* Payout Address */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Payout Address
                  </label>
                  <input
                    type="text"
                    value={formData.payoutAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, payoutAddress: e.target.value })
                    }
                    placeholder="0x..."
                    required
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm"
                  />
                  <p className="text-dark-400 text-sm mt-1">
                    Address to receive your earnings when you withdraw
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register as Creator</span>
                  )}
                </button>
              </div>
            </form>

            {/* Privacy Info */}
            <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
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
                    Your Revenue is Private
                  </h4>
                  <p className="text-dark-300 text-sm mt-1">
                    Your earnings are stored encrypted using FHE. Competitors
                    cannot see how much you earn. Only you can decrypt your
                    revenue.
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

  // Registered - show dashboard
  const priceInEth = profile
    ? formatEther(BigInt(profile.subscriptionPrice))
    : "0";

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
              <p className="text-dark-400 mt-1">
                Manage your creator profile and earnings
              </p>
            </div>
            <a
              href={`/creator/${address}`}
              className="px-4 py-2 glass rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              View Public Profile
            </a>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            {/* Subscribers */}
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Total Subscribers</div>
              <div className="text-3xl font-bold text-white">
                {profile?.subscriberCount || 0}
              </div>
            </div>

            {/* Price */}
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Subscription Price</div>
              <div className="text-3xl font-bold text-primary-400">
                {parseFloat(priceInEth).toFixed(4)} ETH
              </div>
            </div>

            {/* Revenue */}
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Total Revenue</div>
              {revenue !== null ? (
                <div className="text-3xl font-bold text-green-400">
                  {formatEther(revenue)} ETH
                </div>
              ) : (
                <button
                  onClick={requestRevenueDecrypt}
                  disabled={isDecryptingRevenue}
                  className="text-primary-400 hover:text-primary-300 flex items-center gap-2"
                >
                  {isDecryptingRevenue ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                      <span>Decrypting...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>Reveal Revenue</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Withdraw Earnings
            </h2>

            {revenue === null ? (
              <p className="text-dark-400">
                Click &quot;Reveal Revenue&quot; above to see your earnings before
                withdrawing.
              </p>
            ) : revenue === BigInt(0) ? (
              <p className="text-dark-400">
                No earnings to withdraw yet. Get some subscribers!
              </p>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-dark-400 text-sm">Available to withdraw</div>
                  <div className="text-2xl font-bold text-white">
                    {formatEther(revenue)} ETH
                  </div>
                  <div className="text-dark-400 text-sm mt-1">
                    Will be sent to: {profile?.payoutAddress?.slice(0, 6)}...
                    {profile?.payoutAddress?.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={withdrawRevenue}
                  disabled={isWithdrawing}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isWithdrawing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Withdrawing...</span>
                    </>
                  ) : (
                    <span>Withdraw All</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h4 className="text-primary-400 font-semibold">
                  Revenue Privacy
                </h4>
                <p className="text-dark-300 text-sm mt-1">
                  Your revenue is stored encrypted on-chain. When you click
                  &quot;Reveal Revenue&quot;, the FHE coprocessor decrypts it for your
                  eyes only. No one else can see your earnings.
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
