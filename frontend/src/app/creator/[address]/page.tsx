"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, usePublicClient, useSignTypedData } from "wagmi";
import { formatEther } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeModal } from "@/components/SubscribeModal";
import { useCreator } from "@/hooks/useCreators";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES, API_ENDPOINTS } from "@/config/wagmi";
import { SubscriptionStatus } from "@/types";
import {
  getVaultStatusCopy,
  readPrivateVault,
  updatePrivateVaultVerification,
} from "@/lib/privateVault";

const ACCESS_DECRYPT_TYPES = {
  AccessDecrypt: [
    { name: "creator", type: "address" },
    { name: "subscriber", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export default function CreatorProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const { address: userAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();

  const { creator, isLoading, error } = useCreator(address);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<SubscriptionStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState<string | null>(null);
  const [isTrackedLocally, setIsTrackedLocally] = useState(false);

  useEffect(() => {
    if (!userAddress || !address) return;

    const entry = readPrivateVault(userAddress).find(
      (item) => item.creatorAddress.toLowerCase() === address.toLowerCase()
    );

    setVerifiedStatus(entry?.status ?? null);
    setIsTrackedLocally(Boolean(entry));
  }, [userAddress, address]);

  const handleVerifyAccess = async () => {
    if (!userAddress || !publicClient) return;

    setIsVerifying(true);
    setVerifyStep("Signing request...");

    try {
      const nonceResponse = await fetch(
        `${API_ENDPOINTS.relayer}/api/subscribe/nonce/${userAddress}`
      );

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      const signature = await signTypedDataAsync({
        domain: {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: BigInt(421614),
          verifyingContract: CONTRACT_ADDRESSES.relayer as `0x${string}`,
        },
        types: ACCESS_DECRYPT_TYPES,
        primaryType: "AccessDecrypt",
        message: {
          creator: address as `0x${string}`,
          subscriber: userAddress,
          nonce: BigInt(nonce),
          deadline,
        },
      });

      setVerifyStep("Submitting to relayer...");

      const response = await fetch(`${API_ENDPOINTS.relayer}/api/subscribe/access-decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          subscriber: userAddress,
          deadline: deadline.toString(),
          nonce: nonce.toString(),
          signature,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || "Access decrypt failed");
      }

      setVerifyStep("Waiting for FHE decryption (~5-30s)...");

      let attempts = 0;
      const maxAttempts = 15;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 4000));

        try {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
            abi: SUBSCRIPTION_ABI,
            functionName: "isAccessDecryptReady",
            args: [address as `0x${string}`],
            account: userAddress,
          });

          const [ready, status] = result as [boolean, number];

          if (ready) {
            const nextStatus = status as SubscriptionStatus;
            setVerifiedStatus(nextStatus);
            updatePrivateVaultVerification(userAddress, address, nextStatus);
            setVerifyStep(null);
            return;
          }
        } catch {
          // Keep polling until timeout.
        }

        attempts += 1;
      }

      setVerifyStep("Timed out. Please try again.");
      setTimeout(() => setVerifyStep(null), 3000);
    } catch (err) {
      console.error("Verify failed:", err);
      setVerifyStep(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubscribeSuccess = () => {
    setIsTrackedLocally(true);
  };

  const pageState = useMemo(() => {
    if (verifiedStatus === SubscriptionStatus.ACTIVE) {
      return getVaultStatusCopy("verified-active", verifiedStatus);
    }

    if (verifiedStatus !== null) {
      return getVaultStatusCopy("verified-inactive", verifiedStatus);
    }

    if (isTrackedLocally) {
      return getVaultStatusCopy("awaiting-verification", verifiedStatus);
    }

    return getVaultStatusCopy("not-started", verifiedStatus);
  }, [isTrackedLocally, verifiedStatus]);

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
          <p className="text-dark-400 mb-6">This creator has not registered on OnlyPaca yet.</p>
          <a
            href="/explore"
            className="px-6 py-3 bg-primary-500 rounded-xl text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            Explore Creators
          </a>
        </div>
        <Footer />
      </main>
    );
  }

  const priceInEth = formatEther(BigInt(creator.subscriptionPrice));
  const isOwnProfile = userAddress?.toLowerCase() === creator.address.toLowerCase();
  const isActive = verifiedStatus === SubscriptionStatus.ACTIVE;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-16 h-64 bg-[radial-gradient(circle_at_top_left,rgba(255,26,108,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_26%),linear-gradient(160deg,rgba(10,14,28,0.98),rgba(15,23,42,0.86))] relative">
        {creator.banner && (
          <img src={creator.banner} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="w-32 h-32 rounded-[2rem] bg-dark-800 border-4 border-dark-950 overflow-hidden flex-shrink-0 shadow-2xl">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {creator.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">Creator Profile</p>
            {creator.contentProfile?.category && (
              <div className="mt-3">
                <span className="px-3 py-1 rounded-full border border-primary-500/20 bg-primary-500/10 text-primary-300 text-xs">
                  {creator.contentProfile.category}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-3">{creator.name}</h1>
            <p className="text-dark-400 mt-2 text-sm font-mono">
              {creator.address.slice(0, 6)}...{creator.address.slice(-4)}
            </p>
            <p className="text-dark-300 mt-5 max-w-2xl">
              {creator.bio || "No bio yet. This creator has a live profile and private subscription flow."}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-6">
              <div>
                <div className="text-2xl font-bold text-white">{creator.subscriberCount}</div>
                <div className="text-dark-400 text-sm">Public subscriber count</div>
              </div>
              <div className="w-px h-10 bg-dark-700 hidden sm:block" />
              <div>
                <div className="text-2xl font-bold text-primary-400">
                  {Number.parseFloat(priceInEth).toFixed(4)} ETH
                </div>
                <div className="text-dark-400 text-sm">Current subscription price</div>
              </div>
            </div>

            {(creator.socialLinks?.twitter || creator.socialLinks?.instagram || creator.socialLinks?.website) && (
              <div className="flex flex-wrap gap-3 mt-5 text-sm">
                {creator.socialLinks?.twitter && (
                  <a
                    href={creator.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    Twitter
                  </a>
                )}
                {creator.socialLinks?.instagram && (
                  <a
                    href={creator.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    Instagram
                  </a>
                )}
                {creator.socialLinks?.website && (
                  <a
                    href={creator.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-300 hover:text-primary-200"
                  >
                    Website
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="w-full lg:w-auto">
            {isOwnProfile ? (
              <a
                href="/dashboard/creator"
                className="block w-full lg:w-auto px-6 py-3 glass rounded-2xl text-center text-white font-semibold hover:bg-white/10 transition-all"
              >
                Open Creator Studio
              </a>
            ) : (
              <button
                onClick={() => setShowSubscribeModal(true)}
                disabled={!isConnected}
                className="w-full lg:w-auto px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl font-semibold text-white glow-hover transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isConnected ? "Start Private Subscription" : "Connect Wallet to Subscribe"}
              </button>
            )}
          </div>
        </div>

        {!isOwnProfile && (
          <div className="mt-8 grid lg:grid-cols-[1.45fr,0.95fr] gap-4">
            <div className="glass rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                    Private Access Journey
                  </p>
                  <h2 className="text-xl font-semibold text-white mt-3">
                    {pageState.label}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full border border-white/10 text-dark-300 text-xs">
                  Browser-private helper
                </span>
              </div>

              <p className="text-dark-300 text-sm mt-4">{pageState.helper}</p>

              <div className="grid md:grid-cols-3 gap-3 mt-5">
                {[
                  {
                    step: "01",
                    title: "Sign locally",
                    body: "You authorize the subscription via EIP-712 typed data.",
                  },
                  {
                    step: "02",
                    title: "Relayer pays gas",
                    body: "The relayer submits the transaction so your wallet never calls the subscription contract directly.",
                  },
                  {
                    step: "03",
                    title: "Verify with CoFHE",
                    body: "Only your wallet can ask for and read the decrypted access result.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-white/8 bg-dark-900/40 p-4"
                  >
                    <div className="text-primary-300 text-xs font-semibold">{item.step}</div>
                    <div className="text-white text-sm font-semibold mt-2">{item.title}</div>
                    <div className="text-dark-400 text-xs mt-2">{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6">
              <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">
                Privacy Surface
              </p>
              <div className="space-y-4 mt-5">
                <div>
                  <div className="text-white font-semibold">Caller shown on-chain</div>
                  <div className="text-dark-400 text-sm mt-1">
                    The relayer contract appears as the caller, not your wallet.
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold">Stored subscription data</div>
                  <div className="text-dark-400 text-sm mt-1">
                    FHE ciphertext for access state and encrypted creator revenue.
                  </div>
                </div>
                <div>
                  <div className="text-white font-semibold">What is intentionally unavailable</div>
                  <div className="text-dark-400 text-sm mt-1">
                    No public subscriber list, and no public API that enumerates who subscribed to whom.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {creator.contentProfile && (
            <div className="grid lg:grid-cols-[1fr,1fr] gap-4 mb-4">
              <div className="glass rounded-[2rem] p-6">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">Content Structure</p>
                <h2 className="text-xl font-semibold text-white mt-3">
                  {creator.contentProfile.title || "Private subscriber experience"}
                </h2>
                <p className="text-dark-300 text-sm mt-3">
                  {creator.contentProfile.summary ||
                    "This creator has configured a structured private delivery flow."}
                </p>
                {creator.contentProfile.previewNote && (
                  <div className="rounded-2xl border border-white/8 bg-dark-900/40 p-4 mt-5">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Preview Note</div>
                    <div className="text-dark-300 text-sm mt-2">{creator.contentProfile.previewNote}</div>
                  </div>
                )}
              </div>

              <div className="glass rounded-[2rem] p-6">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em]">Delivery Notes</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  <div className="rounded-2xl border border-white/8 bg-dark-900/40 p-4">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Delivery Method</div>
                    <div className="text-white text-sm font-semibold mt-2">
                      {creator.contentProfile.deliveryMethod || "private delivery"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-dark-900/40 p-4">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Cadence</div>
                    <div className="text-white text-sm font-semibold mt-2">
                      {creator.contentProfile.cadence || "custom"}
                    </div>
                  </div>
                </div>
                {creator.contentProfile.accessInstructions && (
                  <div className="rounded-2xl border border-white/8 bg-dark-900/40 p-4 mt-3">
                    <div className="text-dark-500 text-xs uppercase tracking-[0.2em]">Access Instructions</div>
                    <div className="text-dark-300 text-sm mt-2">
                      {creator.contentProfile.accessInstructions}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-white mb-4">Exclusive Content</h2>

          {isActive && creator.contentURL && (
            <div className="glass rounded-[2rem] p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm font-semibold">Access Verified</span>
              </div>
              <p className="text-dark-300 text-sm mb-4">
                You completed a recent FHE verification for {creator.name}. The content link is now
                available in this session.
              </p>
              <a
                href={creator.contentURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-2xl font-semibold text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Content
              </a>
            </div>
          )}

          {verifiedStatus !== null && !isActive && (
            <div className="glass rounded-[2rem] p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Access</h3>
              <p className="text-dark-400 mb-4">
                Your latest FHE verification did not return active access for this creator.
              </p>
              {!isOwnProfile && (
                <button
                  onClick={() => setShowSubscribeModal(true)}
                  disabled={!isConnected}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl font-semibold text-white glow-hover hover:scale-105 transition-all disabled:opacity-50"
                >
                  Subscribe for {Number.parseFloat(priceInEth).toFixed(4)} ETH
                </button>
              )}
            </div>
          )}

          {verifiedStatus === null && isTrackedLocally && !isOwnProfile && (
            <div className="glass rounded-[2rem] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Run access verification</h3>
                  <p className="text-dark-400 text-sm mb-1">
                    Your browser recorded a prior relay or interaction for this creator. To unlock
                    content, trigger a private CoFHE access check now.
                  </p>
                  <p className="text-dark-500 text-xs mb-4">
                    You sign a message, the relayer submits it privately, and the FHE coprocessor
                    resolves the result asynchronously.
                  </p>
                  <button
                    onClick={handleVerifyAccess}
                    disabled={isVerifying}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{verifyStep || "Verifying..."}</span>
                      </>
                    ) : (
                      <span>Verify Access</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {verifiedStatus === null && !isTrackedLocally && !isOwnProfile && (
            <div className="glass rounded-[2rem] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Exclusive Content</h3>
              <p className="text-dark-400 mb-6">
                Start a private subscription to unlock {creator.name}&apos;s content. After relay,
                you still verify access explicitly with FHE before opening the link.
              </p>
              <button
                onClick={() => setShowSubscribeModal(true)}
                disabled={!isConnected}
                className="px-6 py-3 bg-primary-500/20 border border-primary-500 rounded-2xl text-primary-400 font-semibold hover:bg-primary-500/30 transition-all disabled:opacity-50"
              >
                {isConnected
                  ? `Unlock for ${Number.parseFloat(priceInEth).toFixed(4)} ETH`
                  : "Connect Wallet to Subscribe"}
              </button>
            </div>
          )}

          {isOwnProfile && (
            <div className="glass rounded-[2rem] p-6">
              <h3 className="text-white font-semibold mb-2">Your Content Delivery</h3>
              {creator.contentURL ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-dark-400 text-sm">
                      Content URL is set. Verified subscribers will see it after their own access check.
                    </span>
                    <a
                      href="/dashboard/creator"
                      className="text-primary-400 hover:text-primary-300 text-sm ml-auto"
                    >
                      Edit
                    </a>
                  </div>
                  {creator.contentProfile?.accessInstructions && (
                    <div className="rounded-2xl border border-white/8 bg-dark-900/40 p-4 text-sm text-dark-300">
                      {creator.contentProfile.accessInstructions}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-dark-400 text-sm">No content URL set yet.</span>
                  <a
                    href="/dashboard/creator"
                    className="text-primary-400 hover:text-primary-300 text-sm ml-auto"
                  >
                    Add content
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        creator={creator}
        onSuccess={handleSubscribeSuccess}
      />

      <Footer />
    </main>
  );
}
