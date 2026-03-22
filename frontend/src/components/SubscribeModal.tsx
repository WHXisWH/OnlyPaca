"use client";

import { useEffect } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Creator } from "@/types";
import { useSubscribe } from "@/hooks/useSubscribe";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator;
}

export function SubscribeModal({ isOpen, onClose, creator }: SubscribeModalProps) {
  const { isConnected } = useAccount();
  const { subscribe, reset, state, isSigning, isPending, isSuccess, isError } =
    useSubscribe({
      onSuccess: () => {
        // Keep modal open to show success state
      },
    });

  const priceInEth = formatEther(BigInt(creator.subscriptionPrice));

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(reset, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    subscribe(creator.address);
  };

  const handleClose = () => {
    if (!isSigning && !isPending) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass rounded-2xl p-6 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        {!isSigning && !isPending && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Success State */}
        {isSuccess && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Subscription Successful!
            </h3>
            <p className="text-dark-400 mb-6">
              You now have access to {creator.name}&apos;s content. Your
              subscription is encrypted and private.
            </p>
            {state.status === "success" && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${state.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                View transaction →
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-6 w-full px-6 py-3 bg-primary-500 rounded-xl font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Subscription Failed
            </h3>
            <p className="text-dark-400 mb-6">
              {state.status === "error" ? state.error : "An error occurred"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 px-6 py-3 glass rounded-xl font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-dark-700 rounded-xl font-semibold text-white hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Default State */}
        {!isSuccess && !isError && (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">
                Subscribe to {creator.name}
              </h2>
              <p className="text-dark-400 mt-1">
                Unlock exclusive content with complete privacy
              </p>
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                {creator.avatar ? (
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold truncate">
                  {creator.name}
                </div>
                <div className="text-dark-400 text-sm">
                  {creator.subscriberCount} subscribers
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl mb-6">
              <span className="text-dark-300">Subscription Price</span>
              <span className="text-xl font-bold text-white">
                {parseFloat(priceInEth).toFixed(4)} ETH
              </span>
            </div>

            {/* Privacy Info */}
            <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl mb-6">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm">
                  <span className="text-primary-400 font-semibold">
                    Privacy Protected:{" "}
                  </span>
                  <span className="text-dark-300">
                    Your subscription is encrypted on-chain. No one can link your
                    wallet to this creator.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubscribe}
                disabled={!isConnected || isSigning || isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl font-semibold text-white glow-hover transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSigning && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sign Message...</span>
                  </>
                )}
                {isPending && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                )}
                {!isSigning && !isPending && (
                  <span>Subscribe for {parseFloat(priceInEth).toFixed(4)} ETH</span>
                )}
              </button>

              <button
                onClick={handleClose}
                disabled={isSigning || isPending}
                className="w-full px-6 py-3 glass rounded-xl font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* How it works */}
            <div className="mt-6 pt-6 border-t border-dark-700">
              <h4 className="text-sm font-semibold text-white mb-3">
                How it works:
              </h4>
              <ol className="text-sm text-dark-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-semibold">1.</span>
                  Sign a message to authorize the subscription
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-semibold">2.</span>
                  Our relayer submits the transaction (your wallet stays private)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-semibold">3.</span>
                  Access is stored encrypted using FHE
                </li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
