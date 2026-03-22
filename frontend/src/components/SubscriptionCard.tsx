"use client";

import Link from "next/link";
import { SubscriptionStatus } from "@/types";

interface Subscription {
  creatorAddress: string;
  creatorName: string;
  creatorAvatar?: string;
  status: SubscriptionStatus | null;
  subscribedAt?: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onVerify: () => void;
  isVerifying: boolean;
}

export function SubscriptionCard({
  subscription,
  onVerify,
  isVerifying,
}: SubscriptionCardProps) {
  const getStatusBadge = () => {
    if (subscription.status === null) {
      return (
        <span className="px-2 py-1 bg-dark-700 text-dark-400 rounded text-xs">
          Not Verified
        </span>
      );
    }

    switch (subscription.status) {
      case SubscriptionStatus.ACTIVE:
        return (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
            Active
          </span>
        );
      case SubscriptionStatus.EXPIRED:
        return (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
            Expired
          </span>
        );
      case SubscriptionStatus.NOT_SUBSCRIBED:
        return (
          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
            Not Subscribed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-4">
        {/* Creator Avatar */}
        <Link href={`/creator/${subscription.creatorAddress}`}>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
            {subscription.creatorAvatar ? (
              <img
                src={subscription.creatorAvatar}
                alt={subscription.creatorName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white font-bold text-xl">
                {subscription.creatorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/creator/${subscription.creatorAddress}`}>
              <h3 className="text-lg font-semibold text-white hover:text-primary-400 transition-colors truncate">
                {subscription.creatorName}
              </h3>
            </Link>
            {getStatusBadge()}
          </div>
          <p className="text-dark-400 text-sm font-mono truncate">
            {subscription.creatorAddress.slice(0, 6)}...
            {subscription.creatorAddress.slice(-4)}
          </p>
          {subscription.subscribedAt && (
            <p className="text-dark-500 text-xs mt-1">
              Subscribed {new Date(subscription.subscribedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Verify Button */}
          <button
            onClick={onVerify}
            disabled={isVerifying}
            className="px-4 py-2 glass rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Verifying...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                <span className="hidden sm:inline">Verify Access</span>
              </>
            )}
          </button>

          {/* View Content (if active) */}
          {subscription.status === SubscriptionStatus.ACTIVE && (
            <Link
              href={`/creator/${subscription.creatorAddress}`}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
              <span className="hidden sm:inline">View Content</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
