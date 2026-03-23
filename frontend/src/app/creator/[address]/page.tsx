"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, useSignTypedData, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscribeModal } from "@/components/SubscribeModal";
import { useCreator } from "@/hooks/useCreators";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES, API_ENDPOINTS } from "@/config/wagmi";
import { SubscriptionStatus } from "@/types";

// EIP-712 type definitions for access decrypt
const ACCESS_DECRYPT_TYPES = {
  AccessDecrypt: [
    { name: "creator", type: "address" },
    { name: "subscriber", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

function getStoredVerifiedStatus(userAddress: string, creatorAddress: string): SubscriptionStatus | null {
  try {
    const key = `onlypaca_verified_${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`;
    const val = localStorage.getItem(key);
    return val !== null ? (parseInt(val) as SubscriptionStatus) : null;
  } catch {
    return null;
  }
}

function setStoredVerifiedStatus(userAddress: string, creatorAddress: string, status: SubscriptionStatus) {
  try {
    const key = `onlypaca_verified_${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`;
    localStorage.setItem(key, status.toString());
  } catch {}
}

function isSubscribedInStorage(userAddress: string, creatorAddress: string): boolean {
  try {
    const key = `onlypaca_subs_${userAddress.toLowerCase()}`;
    const subs: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    return subs.includes(creatorAddress.toLowerCase());
  } catch {
    return false;
  }
}

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
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Load verified status from localStorage on mount
  useEffect(() => {
    if (userAddress && address) {
      const status = getStoredVerifiedStatus(userAddress, address);
      setVerifiedStatus(status);
      setIsSubscribed(isSubscribedInStorage(userAddress, address));
    }
  }, [userAddress, address]);

  // Verify access via Relayer (privacy-preserving)
  const handleVerifyAccess = async () => {
    if (!userAddress || !publicClient) return;
    setIsVerifying(true);
    setVerifyStep("Signing request...");

    try {
      // 1. Get nonce from relayer
      const nonceResponse = await fetch(
        `${API_ENDPOINTS.relayer}/api/subscribe/nonce/${userAddress}`
      );

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();

      // 2. Calculate deadline (1 hour from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // 3. Sign EIP-712 message
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

      setVerifyStep("Sending to relayer...");

      // 4. Send to relayer
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
        const error = await response.json();
        throw new Error(error.message || "Access decrypt failed");
      }

      setVerifyStep("Waiting for FHE decryption (~5–30s)...");

      let attempts = 0;
      const maxAttempts = 15;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 4000));

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
            const subStatus = status as SubscriptionStatus;
            setVerifiedStatus(subStatus);
            setStoredVerifiedStatus(userAddress, address, subStatus);
            setVerifyStep(null);
            return;
          }
        } catch { /* keep polling */ }

        attempts++;
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
    if (userAddress) {
      setIsSubscribed(true);
    }
  };

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
          <a href="/explore" className="px-6 py-3 bg-primary-500 rounded-xl text-white font-semibold hover:bg-primary-600 transition-colors">
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

      {/* Banner */}
      <div className="pt-16 h-64 bg-gradient-to-br from-primary-600/30 to-purple-600/30 relative">
        {creator.banner && (
          <img src={creator.banner} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-32 h-32 rounded-2xl bg-dark-800 border-4 border-dark-950 overflow-hidden flex-shrink-0">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">{creator.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{creator.name}</h1>
            <p className="text-dark-400 mt-1 text-sm font-mono">
              {creator.address.slice(0, 6)}...{creator.address.slice(-4)}
            </p>
            <p className="text-dark-300 mt-4">{creator.bio || "No bio yet"}</p>
            <div className="flex items-center gap-6 mt-6">
              <div>
                <div className="text-2xl font-bold text-white">{creator.subscriberCount}</div>
                <div className="text-dark-400 text-sm">Subscribers</div>
              </div>
              <div className="w-px h-10 bg-dark-700" />
              <div>
                <div className="text-2xl font-bold text-primary-400">{parseFloat(priceInEth).toFixed(4)} ETH</div>
                <div className="text-dark-400 text-sm">per month</div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            {isOwnProfile ? (
              <a href="/dashboard/creator" className="block w-full sm:w-auto px-6 py-3 glass rounded-xl text-center text-white font-semibold hover:bg-white/10 transition-all">
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
              <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Privacy Protected by FHE</h3>
              <p className="text-dark-400 text-sm mt-1">
                Your subscription is encrypted on-chain. No one — not even us — can see that you subscribed to this creator. Only you can verify your own access.
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Exclusive Content</h2>

          {/* Already verified as active */}
          {isActive && creator.contentURL && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 text-sm font-semibold">Access Verified</span>
              </div>
              <p className="text-dark-300 text-sm mb-4">You have active access to {creator.name}&apos;s exclusive content.</p>
              <a
                href={creator.contentURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Content
              </a>
            </div>
          )}

          {/* Verified but not active */}
          {verifiedStatus !== null && !isActive && (
            <div className="glass rounded-xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Active Subscription</h3>
              <p className="text-dark-400 mb-4">You don&apos;t currently have an active subscription to this creator.</p>
              {!isOwnProfile && (
                <button
                  onClick={() => setShowSubscribeModal(true)}
                  disabled={!isConnected}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover hover:scale-105 transition-all disabled:opacity-50"
                >
                  Subscribe for {parseFloat(priceInEth).toFixed(4)} ETH
                </button>
              )}
            </div>
          )}

          {/* Subscribed but not verified yet */}
          {verifiedStatus === null && isSubscribed && !isOwnProfile && (
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">One more step — verify your access</h3>
                  <p className="text-dark-400 text-sm mb-1">
                    Your subscription was recorded. To unlock content, you need to trigger a private FHE decryption — this proves your access without revealing your identity.
                  </p>
                  <p className="text-dark-500 text-xs mb-4">
                    You&apos;ll sign a message (no gas), the relayer submits it privately, then the FHE coprocessor decrypts your status (~5–30s).
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

          {/* Not subscribed + not own profile */}
          {verifiedStatus === null && !isSubscribed && !isOwnProfile && (
            <div className="glass rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Exclusive Content</h3>
              <p className="text-dark-400 mb-6">Subscribe to unlock {creator.name}&apos;s exclusive content. Your subscription is private — encrypted on-chain.</p>
              <button
                onClick={() => setShowSubscribeModal(true)}
                disabled={!isConnected}
                className="px-6 py-3 bg-primary-500/20 border border-primary-500 rounded-xl text-primary-400 font-semibold hover:bg-primary-500/30 transition-all disabled:opacity-50"
              >
                {isConnected ? `Unlock for ${parseFloat(priceInEth).toFixed(4)} ETH` : "Connect Wallet to Subscribe"}
              </button>
            </div>
          )}

          {/* Own profile — content management hint */}
          {isOwnProfile && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Your Content</h3>
              {creator.contentURL ? (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-dark-400 text-sm">Content URL is set. Verified subscribers can access it.</span>
                  <a href="/dashboard/creator" className="text-primary-400 hover:text-primary-300 text-sm ml-auto">
                    Edit →
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-dark-400 text-sm">No content URL set yet.</span>
                  <a href="/dashboard/creator" className="text-primary-400 hover:text-primary-300 text-sm ml-auto">
                    Add content →
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
