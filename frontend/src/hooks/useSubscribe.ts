"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { TransactionState } from "@/types";
import { API_ENDPOINTS, CONTRACT_ADDRESSES } from "@/config/wagmi";

const SUBSCRIBE_TYPES = {
  Subscribe: [
    { name: "creator", type: "address" },
    { name: "subscriber", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

interface UseSubscribeOptions {
  onSuccess?: (hash: string) => void;
  onError?: (error: string) => void;
}

export function useSubscribe(options?: UseSubscribeOptions) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const subscribe = useCallback(
    async (creatorAddress: string) => {
      if (!address) {
        setState({ status: "error", error: "Wallet not connected" });
        options?.onError?.("Wallet not connected");
        return;
      }

      try {
        setState({ status: "signing" });

        // 1. Get nonce from relayer
        const nonceResponse = await fetch(
          `${API_ENDPOINTS.relayer}/api/subscribe/nonce/${address}`
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
            chainId: BigInt(421614), // Arbitrum Sepolia
            verifyingContract: CONTRACT_ADDRESSES.relayer as `0x${string}`,
          },
          types: SUBSCRIBE_TYPES,
          primaryType: "Subscribe",
          message: {
            creator: creatorAddress as `0x${string}`,
            subscriber: address,
            nonce: BigInt(nonce),
            deadline,
          },
        });

        setState({ status: "pending", hash: "" });

        // 4. Send to relayer
        const response = await fetch(`${API_ENDPOINTS.relayer}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creator: creatorAddress,
            subscriber: address,
            deadline: deadline.toString(),
            nonce: nonce.toString(),
            signature,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Subscription failed");
        }

        const result = await response.json();

        // Persist subscription to localStorage so it appears in My Subscriptions
        try {
          const key = `onlypaca_subs_${address.toLowerCase()}`;
          const existing: string[] = JSON.parse(localStorage.getItem(key) || "[]");
          if (!existing.includes(creatorAddress.toLowerCase())) {
            existing.push(creatorAddress.toLowerCase());
            localStorage.setItem(key, JSON.stringify(existing));
          }
          // Store timestamp
          localStorage.setItem(
            `onlypaca_subtime_${address.toLowerCase()}_${creatorAddress.toLowerCase()}`,
            new Date().toISOString()
          );
        } catch { /* localStorage may be unavailable */ }

        setState({ status: "success", hash: result.transactionHash });
        options?.onSuccess?.(result.transactionHash);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setState({ status: "error", error: message });
        options?.onError?.(message);
      }
    },
    [address, signTypedDataAsync, options]
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    subscribe,
    reset,
    state,
    isIdle: state.status === "idle",
    isSigning: state.status === "signing",
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
  };
}
