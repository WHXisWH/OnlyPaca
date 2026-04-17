"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { SubscriptionStatus } from "@/types";

interface Subscription {
  creatorAddress: string;
  creatorName: string;
  creatorBio?: string;
  creatorAvatar?: string;
  subscriptionPrice?: string;
  contentURL?: string;
  status: SubscriptionStatus | null;
  subscribedAt?: string;
  txHash?: string;
  statusLabel: string;
  statusHelper: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onVerify: () => void;
  isVerifying: boolean;
  verifyStep?: string | null;
}

export function SubscriptionCard({
  subscription,
  onVerify,
  isVerifying,
  verifyStep,
}: SubscriptionCardProps) {
  const price =
    subscription.subscriptionPrice && Number(subscription.subscriptionPrice) > 0
      ? `${Number.parseFloat(
          formatEther(BigInt(subscription.subscriptionPrice))
        ).toFixed(4)} ETH`
      : null;

  const getStatusBadgeClass = () => {
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return "bg-green-500/20 text-green-400";
    }

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      return "bg-yellow-500/20 text-yellow-400";
    }

    if (subscription.status === SubscriptionStatus.NOT_SUBSCRIBED) {
      return "bg-red-500/20 text-red-400";
    }

    return "bg-dark-700 text-dark-300";
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <Link href={`/creator/${subscription.creatorAddress}`}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform overflow-hidden">
            {subscription.creatorAvatar ? (
              <img
                src={subscription.creatorAvatar}
                alt={subscription.creatorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-xl">
                {subscription.creatorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/creator/${subscription.creatorAddress}`}>
              <h3 className="text-lg font-semibold text-white hover:text-primary-400 transition-colors truncate">
                {subscription.creatorName}
              </h3>
            </Link>
            <span className={`px-2.5 py-1 rounded-full text-xs ${getStatusBadgeClass()}`}>
              {subscription.statusLabel}
            </span>
          </div>

          <p className="text-dark-400 text-sm font-mono truncate">
            {subscription.creatorAddress.slice(0, 6)}...
            {subscription.creatorAddress.slice(-4)}
          </p>

          {subscription.creatorBio && (
            <p className="text-dark-400 text-sm mt-2 line-clamp-2">
              {subscription.creatorBio}
            </p>
          )}

          <p className="text-dark-500 text-xs mt-2">{subscription.statusHelper}</p>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-dark-400">
            {subscription.subscribedAt && (
              <span>
                Saved {new Date(subscription.subscribedAt).toLocaleDateString()}
              </span>
            )}
            {price && <span>{price}</span>}
            {subscription.txHash && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${subscription.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                View relay tx
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="px-4 py-2 glass rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline text-xs">{verifyStep || "Verifying..."}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {subscription.status === null ? "Verify Access" : "Re-verify"}
                </span>
              </>
            )}
          </button>

          {subscription.status === SubscriptionStatus.ACTIVE && (
            <Link
              href={`/creator/${subscription.creatorAddress}`}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <span className="hidden sm:inline">Open Creator</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
