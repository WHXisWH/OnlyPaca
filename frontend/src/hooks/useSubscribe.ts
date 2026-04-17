"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignTypedData } from "wagmi";
import { Creator, TransactionState } from "@/types";
import { API_ENDPOINTS, CONTRACT_ADDRESSES } from "@/config/wagmi";
import { upsertPrivateVaultEntry } from "@/lib/privateVault";

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
    async (creator: Pick<
      Creator,
      "address" | "name" | "bio" | "avatar" | "subscriptionPrice" | "contentURL"
    >) => {
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
            creator: creator.address as `0x${string}`,
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
            creator: creator.address,
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

        upsertPrivateVaultEntry(address, {
          creatorAddress: creator.address,
          creatorName: creator.name,
          creatorBio: creator.bio,
          creatorAvatar: creator.avatar,
          subscriptionPrice: creator.subscriptionPrice,
          contentURL: creator.contentURL,
          txHash: result.transactionHash,
          relayedAt: new Date().toISOString(),
          subscribedAt: new Date().toISOString(),
          stage: "relay-submitted",
        });

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
