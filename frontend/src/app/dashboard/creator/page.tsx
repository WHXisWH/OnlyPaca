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
    revenueDecryptStep,
    registerCreator,
    updateProfile,
    requestRevenueDecrypt,
    withdrawRevenue,
    isRegistering,
    isWithdrawing,
  } = useCreatorDashboard();

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    price: "0.01",
    payoutAddress: "",
    contentURL: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Pre-fill payout address and profile data
  useEffect(() => {
    if (address && !formData.payoutAddress) {
      setFormData((prev) => ({ ...prev, payoutAddress: address }));
    }
  }, [address]);

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name,
        bio: profile.bio,
        price: formatEther(BigInt(profile.subscriptionPrice)),
        payoutAddress: profile.payoutAddress,
        contentURL: profile.contentURL || "",
      });
    }
  }, [profile]);

  if (!isConnected) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
            <p className="text-dark-400 mb-8">Connect your wallet to access your creator dashboard.</p>
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
    setRegisterError(null);
    try {
      await registerCreator({
        name: formData.name,
        bio: formData.bio,
        contentURL: formData.contentURL,
        subscriptionPrice: parseEther(formData.price),
        payoutAddress: formData.payoutAddress as `0x${string}`,
      });
    } catch (err: any) {
      setRegisterError(err?.message || "Registration failed. Please try again.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        contentURL: formData.contentURL,
        subscriptionPrice: parseEther(formData.price),
        payoutAddress: formData.payoutAddress as `0x${string}`,
      });
      setIsEditing(false);
    } catch (err: any) {
      setRegisterError(err?.message || "Update failed. Please try again.");
    }
  };

  // ─── Registration form ───────────────────────────────────────────────────────
  if (!isRegistered) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Steps overview */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white">Become a Creator</h1>
              <p className="text-dark-400 mt-2">
                Fill in your profile and set your subscription price. Your revenue will be encrypted on-chain.
              </p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-8">
              {["Set Profile", "Add Content", "Set Price", "Register"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-full bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-dark-400 text-xs hidden sm:block">{step}</span>
                  {i < 3 && <div className="flex-1 h-px bg-dark-700" />}
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister} className="glass rounded-2xl p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-white font-semibold mb-1">Display Name <span className="text-primary-400">*</span></label>
                <p className="text-dark-500 text-xs mb-2">This is shown publicly to potential subscribers.</p>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your creator name"
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-white font-semibold mb-1">Bio</label>
                <p className="text-dark-500 text-xs mb-2">Tell subscribers what they get by subscribing.</p>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your content and what subscribers will get..."
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Content URL */}
              <div>
                <label className="block text-white font-semibold mb-1">Content URL</label>
                <p className="text-dark-500 text-xs mb-2">
                  Link to your exclusive content — a Google Drive folder, IPFS link, Notion page, or any URL. Only verified subscribers will see this.
                </p>
                <input
                  type="url"
                  value={formData.contentURL}
                  onChange={(e) => setFormData({ ...formData, contentURL: e.target.value })}
                  placeholder="https://drive.google.com/... or ipfs://..."
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <p className="text-dark-500 text-xs mt-1">You can update this anytime from your dashboard.</p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-white font-semibold mb-1">Subscription Price (ETH) <span className="text-primary-400">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400">ETH</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-dark-500">5% platform fee — you keep 95%</span>
                  {formData.price && (
                    <span className="text-dark-400">
                      You receive: {(parseFloat(formData.price) * 0.95).toFixed(4)} ETH/sub
                    </span>
                  )}
                </div>
              </div>

              {/* Payout Address */}
              <div>
                <label className="block text-white font-semibold mb-1">Payout Address <span className="text-primary-400">*</span></label>
                <p className="text-dark-500 text-xs mb-2">Where your earnings are sent when you withdraw. Defaults to your connected wallet.</p>
                <input
                  type="text"
                  value={formData.payoutAddress}
                  onChange={(e) => setFormData({ ...formData, payoutAddress: e.target.value })}
                  placeholder="0x..."
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors font-mono text-sm"
                />
              </div>

              {registerError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering on-chain...</span>
                  </>
                ) : (
                  <span>Register as Creator</span>
                )}
              </button>

              <p className="text-dark-500 text-xs text-center">
                This sends a transaction to Arbitrum Sepolia. You'll need a small amount of ETH for gas.
              </p>
            </form>

            <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-primary-400 font-semibold">Your Revenue is Private</h4>
                  <p className="text-dark-300 text-sm mt-1">
                    Your earnings accumulate encrypted on-chain using FHE. No one — not even the platform — can see how much you earn. Only you can decrypt and withdraw.
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

  // ─── Registered — dashboard ──────────────────────────────────────────────────
  const priceInEth = profile ? formatEther(BigInt(profile.subscriptionPrice)) : "0";

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
              <p className="text-dark-400 mt-1">Welcome back, {profile?.name}</p>
            </div>
            <a
              href={`/creator/${address}`}
              className="px-4 py-2 glass rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              View Public Profile →
            </a>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Total Subscribers</div>
              <div className="text-3xl font-bold text-white">{profile?.subscriberCount || 0}</div>
            </div>
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Subscription Price</div>
              <div className="text-3xl font-bold text-primary-400">{parseFloat(priceInEth).toFixed(4)} ETH</div>
            </div>
            <div className="glass rounded-2xl p-6">
              <div className="text-dark-400 text-sm mb-1">Total Revenue</div>
              {revenue !== null ? (
                <div className="text-3xl font-bold text-green-400">{formatEther(revenue)} ETH</div>
              ) : (
                <div>
                  <button
                    onClick={requestRevenueDecrypt}
                    disabled={isDecryptingRevenue}
                    className="text-primary-400 hover:text-primary-300 flex items-center gap-2"
                  >
                    {isDecryptingRevenue ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{revenueDecryptStep || "Decrypting..."}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Reveal Revenue</span>
                      </>
                    )}
                  </button>
                  <p className="text-dark-500 text-xs mt-1">Requires a transaction + ~5–30s FHE decryption</p>
                </div>
              )}
            </div>
          </div>

          {/* Withdraw */}
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Withdraw Earnings</h2>
            {revenue === null ? (
              <p className="text-dark-400 text-sm">Click "Reveal Revenue" above to see your earnings before withdrawing.</p>
            ) : revenue === BigInt(0) ? (
              <p className="text-dark-400 text-sm">No earnings to withdraw yet.</p>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-dark-400 text-sm">Available to withdraw</div>
                  <div className="text-2xl font-bold text-white">{formatEther(revenue)} ETH</div>
                  <div className="text-dark-400 text-sm mt-1">
                    → {profile?.payoutAddress?.slice(0, 6)}...{profile?.payoutAddress?.slice(-4)}
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

          {/* Content URL */}
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Your Content</h2>
                <p className="text-dark-400 text-sm mt-1">This URL is shown exclusively to verified subscribers.</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 glass rounded-lg text-white hover:bg-white/10 transition-colors text-sm"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {!isEditing ? (
              <div>
                {profile?.contentURL ? (
                  <div className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a
                      href={profile.contentURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 text-sm truncate"
                    >
                      {profile.contentURL}
                    </a>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-dark-600 rounded-xl text-center">
                    <p className="text-dark-400 text-sm mb-2">No content URL set yet.</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-primary-400 hover:text-primary-300 text-sm underline"
                    >
                      Add content URL →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Content URL</label>
                  <p className="text-dark-500 text-xs mb-2">Google Drive folder, IPFS link, Notion page, or any URL your subscribers should access.</p>
                  <input
                    type="url"
                    value={formData.contentURL}
                    onChange={(e) => setFormData({ ...formData, contentURL: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-1">Subscription Price (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>

                {registerError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {registerError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setRegisterError(null); }}
                    className="px-6 py-3 glass rounded-xl text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Privacy notice */}
          <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-primary-400 font-semibold">Revenue Privacy</h4>
                <p className="text-dark-300 text-sm mt-1">
                  Your revenue is stored encrypted on-chain via FHE. When you click "Reveal Revenue", a transaction triggers decryption — only your wallet can see the result. No one else, including the platform, can read your earnings.
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
