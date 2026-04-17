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
  onSuccess?: () => void;
}

const privateFacts = [
  {
    title: "Your wallet does not call the subscription contract",
    body: "You sign an EIP-712 authorization off-chain. The relayer pays gas and submits the actual transaction.",
  },
  {
    title: "The subscription edge is encrypted at rest",
    body: "The contract stores your access state as FHE ciphertext, so storage inspection does not reveal who you subscribed to.",
  },
  {
    title: "Unlocking content is a separate verification step",
    body: "After relay succeeds, you still need an FHE access check. Only your wallet can trigger and read that result.",
  },
];

export function SubscribeModal({
  isOpen,
  onClose,
  creator,
  onSuccess,
}: SubscribeModalProps) {
  const { isConnected } = useAccount();
  const { subscribe, reset, state, isSigning, isPending, isSuccess, isError } =
    useSubscribe({
      onSuccess: () => {
        onSuccess?.();
      },
    });

  const priceInEth = formatEther(BigInt(creator.subscriptionPrice));

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(reset, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    subscribe(creator);
  };

  const handleClose = () => {
    if (!isSigning && !isPending) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl glass rounded-[2rem] border border-white/10 p-6 md:p-8 animate-in fade-in zoom-in duration-200">
        {!isSigning && !isPending && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {isSuccess && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <p className="text-primary-300 text-xs uppercase tracking-[0.35em] mb-3">
              Relay Confirmed
            </p>
            <h3 className="text-2xl font-bold text-white mb-3">
              Private subscription recorded.
            </h3>
            <p className="text-dark-300 max-w-lg mx-auto">
              The relayer submitted your subscription for {creator.name}. This is not the final
              unlock step yet. Head back to the creator page or your Private Vault and run
              access verification to trigger FHE decryption.
            </p>

            {state.status === "success" && (
              <a
                href={`https://sepolia.arbiscan.io/tx/${state.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 text-primary-400 hover:text-primary-300 text-sm"
              >
                View relay transaction
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 3h7m0 0v7m0-7L10 14"
                  />
                </svg>
              </a>
            )}

            <div className="grid sm:grid-cols-3 gap-3 mt-8 text-left">
              {[
                "Authorization signed in wallet",
                "Relayer paid gas and called the contract",
                "Next: run FHE access verification",
              ].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-dark-900/50 p-4">
                  <div className="text-primary-400 text-xs font-semibold mb-2">0{index + 1}</div>
                  <div className="text-sm text-dark-200">{item}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-primary-500 rounded-xl font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Return to Creator
              </button>
              <a
                href="/dashboard/subscriptions"
                className="flex-1 px-6 py-3 glass rounded-xl font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Open Private Vault
              </a>
            </div>
          </div>
        )}

        {isError && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Relay failed</h3>
            <div className="text-dark-300 text-sm mb-5 text-left p-4 bg-dark-900/60 rounded-2xl border border-white/5">
              {state.status === "error" ? state.error : "An unexpected error occurred."}
            </div>
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
                Close
              </button>
            </div>
          </div>
        )}

        {!isSuccess && !isError && (
          <>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-[42%]">
                <p className="text-primary-300 text-xs uppercase tracking-[0.35em] mb-3">
                  Private Checkout
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  Subscribe to {creator.name} without exposing the relationship on-chain.
                </h2>
                <p className="text-dark-300 mt-4">
                  OnlyPaca uses a relayer plus Fhenix CoFHE, so your address does not directly
                  show up as the caller of the subscription contract.
                </p>

                <div className="mt-6 rounded-3xl border border-primary-500/20 bg-primary-500/10 p-5">
                  <div className="text-dark-300 text-sm">Subscription price</div>
                  <div className="text-3xl font-bold text-white mt-1">
                    {Number.parseFloat(priceInEth).toFixed(4)} ETH
                  </div>
                  <div className="text-xs text-dark-400 mt-2">
                    Creator receives 95%. Platform fee is capped at 5% in the current flow.
                  </div>
                </div>
              </div>

              <div className="md:flex-1 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-dark-900/50 p-5">
                  <div className="text-white font-semibold">What happens next</div>
                  <div className="space-y-3 mt-4">
                    {[
                      {
                        step: "01",
                        title: "Sign an off-chain authorization",
                        body: "Your wallet signs typed data. No direct contract call happens from your address.",
                      },
                      {
                        step: "02",
                        title: "Relayer broadcasts and pays gas",
                        body: "The backend submits the transaction and funds the payment side of the flow.",
                      },
                      {
                        step: "03",
                        title: "Verify access separately",
                        body: "Because decryption is asynchronous on CoFHE, unlocking content is a second explicit action.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center text-primary-300 text-xs font-semibold flex-shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <div className="text-white text-sm font-semibold">{item.title}</div>
                          <div className="text-dark-400 text-sm mt-1">{item.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-dark-900/50 p-5">
                  <div className="text-white font-semibold">Privacy boundaries</div>
                  <div className="space-y-3 mt-4">
                    {privateFacts.map((fact) => (
                      <div key={fact.title}>
                        <div className="text-sm text-white">{fact.title}</div>
                        <div className="text-sm text-dark-400 mt-1">{fact.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleSubscribe}
                disabled={!isConnected || isSigning || isPending}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl font-semibold text-white glow-hover transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSigning && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Awaiting signature...</span>
                  </>
                )}
                {isPending && (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Relaying transaction...</span>
                  </>
                )}
                {!isSigning && !isPending && (
                  <span>Authorize private subscription</span>
                )}
              </button>

              <button
                onClick={handleClose}
                disabled={isSigning || isPending}
                className="w-full px-6 py-3 glass rounded-2xl font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
